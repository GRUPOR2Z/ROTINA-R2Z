import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("mostra título e descrição", () => {
    render(
      <EmptyState title="Nada por aqui" description="Volte mais tarde." />,
    );

    expect(screen.getByText("Nada por aqui")).toBeInTheDocument();
    expect(screen.getByText("Volte mais tarde.")).toBeInTheDocument();
  });
});
