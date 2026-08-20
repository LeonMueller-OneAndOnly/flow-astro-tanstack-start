/**
 * Einzige Quelle des Absenders. `SMTP_USERNAME` landet in der RFC822-Kopfzeile und als Envelope-From,
 * `SMTP_FROM_NAME` ist der Anzeigename davor. Beide Variablen sind außerhalb der Produktion optional;
 * ist keine Adresse konfiguriert, gibt es keinen Absender und die Vorschau schreibt `null`.
 */
export function getMailSender(): { name: string | null; address: string } | null {
  const address = process.env.SMTP_USERNAME;

  if (address === undefined || address === "") return null;

  const name = process.env.SMTP_FROM_NAME;

  return { name: name === undefined || name === "" ? null : name, address };
}
