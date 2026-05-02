"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Icon, Card, Button } from "@shohojdhara/atomix";
import { useResponsive } from "../hooks/useResponsive";
import { useNetworkMapStore } from "../stores/useNetworkMapStore";

interface MobileLayoutProps {
  children: React.ReactNode;
  searchPanel: React.ReactNode;
  toolbar: React.ReactNode;
  layerControls: React.ReactNode;
  inspectorPanel: React.ReactNode;
  mapControls: React.ReactNode;
}

type BottomSheetType = "search" | "layers" | "inspector" | null;

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  searchPanel,
  toolbar,
  layerControls,
  inspectorPanel,
  mapControls,
}) => {
  const { isMobile } = useResponsive();
  const [activeSheet, setActiveSheet] = useState<BottomSheetType>(null);
  const [sheetHeight, setSheetHeight] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const selectedElement = useNetworkMapStore(
    (state) => state.interaction.selectedElementId
  );

  const sheetRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const openSheet = useCallback((sheet: BottomSheetType) => {
    lastFocusedRef.current = document.activeElement as HTMLElement;
    setActiveSheet(sheet);
    setSheetHeight(sheet === "inspector" ? 85 : 70);
  }, []);

  const closeSheet = useCallback(() => {
    setActiveSheet(null);
    setSheetHeight(50);
    setTimeout(() => lastFocusedRef.current?.focus(), 0);
  }, []);

  const toggleSheet = useCallback(
    (sheet: BottomSheetType) => {
      if (activeSheet === sheet) {
        closeSheet();
      } else {
        openSheet(sheet);
      }
    },
    [activeSheet, openSheet, closeSheet]
  );

  useEffect(() => {
    if (selectedElement && isMobile) {
      openSheet("inspector");
    }
  }, [selectedElement, isMobile, openSheet]);

  useEffect(() => {
    if (!activeSheet || !sheetRef.current) return;
    setTimeout(() => closeButtonRef.current?.focus(), 100);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeSheet();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeSheet, closeSheet]);

  if (!isMobile) return <>{children}</>;

  return (
    <div className="u-relative u-w-100 u-h-100 u-overflow-hidden">
      {/* Main content area */}
      <div className="u-absolute u-inset-0 u-w-100 u-h-100 u-pb-20">{children}</div>

      {/* Floating Action Buttons */}
      <div className="u-absolute u-top-4 u-end-4 u-z-20 u-flex u-flex-column u-gap-3 u-pointer-events-none">
        <div className="u-pointer-events-auto">{toolbar}</div>
        <div className="u-pointer-events-auto">{mapControls}</div>
      </div>

      {/* Bottom Navigation Bar */}
      <nav
        className="u-fixed u-bottom-0 u-start-0 u-w-100 u-h-16 u-flex u-justify-around u-items-center u-z-modal u-backdrop-blur-lg u-border-top u-border-solid u-border-secondary-subtle u-bg-white-opacity-5"
        role="tablist"
      >
        {[
          { id: "search", icon: "MagnifyingGlass", label: "Search" },
          { id: "layers", icon: "Stack", label: "Layers" },
          { id: "inspector", icon: "Info", label: "Details", disabled: !selectedElement },
        ].map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={activeSheet === item.id}
            className={`u-flex u-flex-column u-items-center u-gap-1 u-p-2 u-border-0 u-bg-transparent u-transition-all u-flex-1 u-max-w-20 ${
              activeSheet === item.id ? "" : "u-text-secondary-emphasis"
            } ${item.disabled ? "u-opacity-40 u-cursor-not-allowed" : "u-cursor-pointer"}`}
            onClick={() => !item.disabled && toggleSheet(item.id as BottomSheetType)}
            disabled={item.disabled}
          >
            <Icon name={item.icon as any} size={20} />
            <span
              className="u-text-2xs u-font-bold u-text-uppercase"
              style={{ letterSpacing: "0.5px" }}
            >
              {item.label}
            </span>
            {item.id === "inspector" && selectedElement && (
              <span className="u-absolute u-top-2 u-end-4 u-w-2 u-h-2 u-bg-primary u-rounded-circle u-shadow-sm" />
            )}
          </button>
        ))}
      </nav>

      {/* Bottom Sheet */}
      {activeSheet && (
        <>
          <div
            className="u-fixed u-inset-0 u-bg-black-opacity-50 u-z-40 u-backdrop-blur-sm u-transition-all"
            onClick={closeSheet}
          />
          <div
            ref={sheetRef}
            className="u-fixed u-bottom-16 u-start-0 u-w-100 u-z-modal u-bg-white-opacity-10 u-backdrop-blur-xl u-rounded-top-xl u-flex u-flex-column u-transition-all u-shadow-2xl"
            style={{
              height: `${sheetHeight}%`,
              borderTop: "1px solid var(--color-white-opacity-10)",
            }}
            role="dialog"
          >
            {/* Handle */}
            <div
              className="u-flex u-justify-center u-p-3 u-cursor-ns-resize"
              onClick={() => setSheetHeight(sheetHeight > 70 ? 50 : 85)}
            >
              <div className="u-w-10 u-h-1 u-bg-secondary-subtle u-rounded-pill u-opacity-50" />
            </div>

            {/* Header */}
            <div className="u-flex u-justify-between u-items-center u-px-4 u-pb-4 u-border-bottom u-border-secondary-subtle">
              <h3
                className="u-m-0 u-text-base u-font-bold  u-text-uppercase"
                style={{ letterSpacing: "1px" }}
              >
                {activeSheet === "search" && "Search Assets"}
                {activeSheet === "layers" && "Map Layers"}
                {activeSheet === "inspector" && "Asset Details"}
              </h3>
              <Button
                variant="secondary"
                size="sm"
                iconName="X"
                onClick={closeSheet}
                iconOnly
              />
            </div>

            {/* Content */}
            <div className="u-flex-1 u-overflow-y-auto u-p-4">
              {activeSheet === "search" && searchPanel}
              {activeSheet === "layers" && layerControls}
              {activeSheet === "inspector" && inspectorPanel}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
