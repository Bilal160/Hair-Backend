export class BaseModel<T> {
  responseMessage: string[];
  responseCode: number;
  responseData: T | [];

  constructor(
    responseMessage: string[],
    responseCode: number,
    responseData: T
  ) {
    this.responseMessage = responseMessage;
    this.responseCode = responseCode;
    this.responseData = responseData || [];
  }
}
