export type Attributes = {
  email: string;
  utcOffset: string;
  where?: string;
  orderBy?: string;
};

export type ResetPasswordEmail = {
  username: string;
  fullName: string;
  token: string;
  customerType?: string;
  text?: string;
  subject?: string;
  template?: string;
};

export type ReservationMail = {
  email: string;
  reservationModeName: string;
  member: string;
  reservationDate: string;
  reservationTypeCode: string;
  text?: string;
  template?: string;
  subject?: string;
};
