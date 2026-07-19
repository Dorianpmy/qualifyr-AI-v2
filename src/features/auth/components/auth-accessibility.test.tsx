import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

describe("authentication accessibility primitives", () => {
  it("associates a field label with its input", () => {
    const html = renderToStaticMarkup(<Field label="Adresse email"><Input name="email" type="email" required /></Field>);
    expect(html).toContain("<label");
    expect(html).toContain('name="email"');
    expect(html).toContain("required");
  });

  it("announces errors immediately", () => {
    const html = renderToStaticMarkup(<Alert title="Action impossible" variant="danger">Réessayez.</Alert>);
    expect(html).toContain('role="alert"');
  });

  it("exposes loading and disables double submission", () => {
    const html = renderToStaticMarkup(<Button loading type="submit">Connexion</Button>);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("disabled");
  });
});
