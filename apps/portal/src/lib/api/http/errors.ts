export class PortalApiError extends Error {
  status: number;

  constructor(status: number, message = "Connexion impossible.") {
    super(message);
    this.name = "PortalApiError";
    this.status = status;
  }
}
