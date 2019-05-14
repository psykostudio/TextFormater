export interface IObserver {
  ReceiveNotification<T>(Message: T): void;
}
