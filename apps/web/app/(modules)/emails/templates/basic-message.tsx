import { Body, Container, Head, Html, Preview, Section } from "@react-email/components";

export interface BasicMessageEmailProps {
  bodyHtml: string;
  previewText?: string;
}

/**
 * Minimal React Email wrapper used when composing outbound mail — gives
 * every outgoing message consistent basic styling without requiring the
 * composer to write a full HTML document. `bodyHtml` is the
 * user-authored content from the compose form; rendered to a final HTML
 * string with @react-email/render before being handed to the
 * EmailProvider's `send()`.
 */
export function BasicMessageEmail({ bodyHtml, previewText }: BasicMessageEmailProps) {
  return (
    <Html>
      <Head />
      {previewText ? <Preview>{previewText}</Preview> : null}
      <Body style={{ fontFamily: "Helvetica, Arial, sans-serif", backgroundColor: "#f6f6f6" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "8px" }}>
          <Section dangerouslySetInnerHTML={{ __html: bodyHtml }} />
        </Container>
      </Body>
    </Html>
  );
}
