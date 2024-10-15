import { User } from "..";

export class BehaviorHistory {
  pagesVisited: string[];
  purchasesMade: Purchase[];

  constructor(pagesVisited: string[], purchasesMade: Purchase[]) {
    this.pagesVisited = pagesVisited;
    this.purchasesMade = purchasesMade;
  }
}

export class Purchase {
  productId: string;
  amount: number;
  date: Date;

  constructor(productId: string, amount: number, date: Date) {
    this.productId = productId;
    this.amount = amount;
    this.date = date;
  }
}

export class SocialConnections {
  friends: User[];

  constructor(friends: User[]) {
    this.friends = friends;
  }
}

export class Location {
  latitude: number;
  longitude: number;
  country: string;
  city: string;

  constructor(latitude: number, longitude: number, country: string, city: string) {
    this.latitude = latitude;
    this.longitude = longitude;
    this.country = country;
    this.city = city;
  }
}

export class Demographics {
  age: number;
  gender: string;
  occupation: string;

  constructor(age: number, gender: string, occupation: string) {
    this.age = age;
    this.gender = gender;
    this.occupation = occupation;
  }
}
