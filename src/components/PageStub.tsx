"use client";

import { Card, Container } from "@shohojdhara/atomix";

export function PageStub({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <Container className="u-py-6">
      <Card
        title={title}
        text={description ?? "This module is scaffolded and ready for implementation."}
      />
    </Container>
  );
}
