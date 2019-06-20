import { IObserver } from "./IObserver";
export interface IObservable {
    RegisterObserver(Observer: IObserver): any;
    RemoveObserver(Observer: IObserver): any;
    NotifyObservers(): any;
}
