import { faker } from "@faker-js/faker";
import { BehaviorHistory, Demographics, Location, Purchase, SocialConnections } from "./interests";

export class User {
  id: string;
  name: string;
  email: string;
  behaviorHistory?: BehaviorHistory;
  socialConnections?: SocialConnections;
  location?: Location;
  demographics?: Demographics;

  constructor(
    id: string,
    name: string,
    email: string,
    behaviorHistory: BehaviorHistory | undefined,
    socialConnections: SocialConnections | undefined,
    location: Location | undefined,
    demographics: Demographics | undefined
  ) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.behaviorHistory = behaviorHistory;
    this.socialConnections = socialConnections;
    this.location = location;
    this.demographics = demographics;
  }

  static generateRandomUser(hasSocial = true): User {
    const id = faker.string.uuid();
    const name = faker.person.fullName();
    const email = faker.internet.email();

    const behaviorHistory = new BehaviorHistory(
      faker.helpers.arrayElements(["homepage", "product page", "checkout"], { min: 1, max: 5 }),
      Array.from(
        { length: faker.number.int({ min: 0, max: 5 }) },
        () => new Purchase(faker.string.symbol(), faker.number.int({ min: 10, max: 100 }), faker.date.past())
      )
    );

    let socialConnections: SocialConnections | undefined = undefined;
    if (hasSocial) {
      socialConnections = new SocialConnections(Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () => User.generateRandomUser(false)));
    }

    const location = new Location(faker.location.latitude(), faker.location.longitude(), faker.location.country(), faker.location.city());

    const demographics = new Demographics(
      faker.number.float({ min: 18, max: 80 }),
      faker.helpers.arrayElement(["male", "female", "other"]),
      faker.person.jobTitle()
    );

    return new User(id, name, email, behaviorHistory, socialConnections, location, demographics);
  }

  static calculateUserSimilarityScore(user1: User, user2: User): number {
    const behaviorHistoryScore = this.calculateHistoryScore(user1?.behaviorHistory, user2?.behaviorHistory);
    const socialConnectionsScore = this.calculateSocialConnectionsScore(user1?.socialConnections, user2?.socialConnections);
    const locationScore = this.calculateLocationScore(user1?.location, user2?.location);
    const demographicsScore = this.calculateDemographicsScore(user1?.demographics, user2?.demographics);
    const finalScore = (socialConnectionsScore * 0.1 + behaviorHistoryScore * 0.1 + locationScore * 0.5 + demographicsScore * 0.2);

    return (demographicsScore * 75 + 0.5 * 25) / 100;
  }

  static getUserSimilarityScores(user1: User, user2: User): number[] {
    const behaviorHistoryScore = this.calculateHistoryScore(user1?.behaviorHistory, user2?.behaviorHistory);
    const socialConnectionsScore = this.calculateSocialConnectionsScore(user1?.socialConnections, user2?.socialConnections);
    const locationScore = this.calculateLocationScore(user1?.location, user2?.location);
    const demographicsScore = this.calculateDemographicsScore(user1?.demographics, user2?.demographics);
    const finalScore = [behaviorHistoryScore, socialConnectionsScore, locationScore, demographicsScore];

    return finalScore;
  }

  private static calculateHistoryScore(behaviorHistory1: BehaviorHistory | undefined, behaviorHistory2: BehaviorHistory | undefined): number {
    const pagesVisited1 = behaviorHistory1?.pagesVisited;
    const pagesVisited2 = behaviorHistory2?.pagesVisited;
    const purchasesMade1 = behaviorHistory1?.purchasesMade;
    const purchasesMade2 = behaviorHistory2?.purchasesMade;

    // Calcular a sobreposição de páginas visitadas
    const commonPagesVisited = pagesVisited1?.filter((page) => pagesVisited2?.includes(page));

    // Calcular a sobreposição de compras feitas
    const commonPurchases = purchasesMade1?.filter((purchase1) => purchasesMade2?.some((purchase2) => purchase1.productId === purchase2.productId));

    // Calcular a pontuação com base na proporção de itens em comum em relação ao total de itens
    const totalItems1 = pagesVisited1?.length || 0 + (purchasesMade1?.length || 0);
    const totalItems2 = pagesVisited2?.length || 0 + (purchasesMade2?.length || 0);
    const totalCommonItems = commonPagesVisited?.length || 0 + (commonPurchases?.length || 0);

    const score = totalCommonItems / (totalItems1 + totalItems2);

    return score;
  }

  /**
   * Calculate the similarity score based on the social connections of two users.
   *
   * @param socialConnections1 The social connections of the first user.
   * @param socialConnections2 The social connections of the second user.
   * @returns The similarity score based on the common friends between the two users.
   */
  private static calculateSocialConnectionsScore(socialConnections1: SocialConnections | undefined, socialConnections2: SocialConnections | undefined): number {
    const friends1 = socialConnections1?.friends;
    const friends2 = socialConnections2?.friends;
    const commonFriends = friends1?.filter((friend) => friends2?.some((f) => f.id === friend.id));

    const score = commonFriends?.length || 0 / ((friends1?.length || 0) + (friends2?.length || 0));

    return score;
  }

  /**
   * Calculate the similarity score based on the location of two users.
   *
   * @param location1 The location of the first user.
   * @param location2 The location of the second user.
   * @returns The similarity score based on the distance between the two locations, normalized between 0 and 1.
   */
  private static calculateLocationScore(location1: Location | undefined, location2: Location | undefined): number {
    if (!location1 || !location2) return 0;

    const toRadians = (degree: number) => degree * (Math.PI / 180);
    const { latitude: lat1, longitude: lon1 } = location1;
    const { latitude: lat2, longitude: lon2 } = location2;

    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers

    // Assuming maximum distance possible is the circumference of the Earth ~ 40075 km
    const normalizedDistance = 1 - Math.min(distance / 40075, 1);

    return normalizedDistance;
  }

  /**
   * Calculate the similarity score based on the demographics of two users.
   *
   * @param demographics1 The demographics of the first user.
   * @param demographics2 The demographics of the second user.
   * @returns The similarity score based on the age, gender, and occupation similarities between the two users.
   */
  private static calculateDemographicsScore(demographics1: Demographics | undefined, demographics2: Demographics | undefined): number {
    const ageDifference = Math.abs((demographics1?.age || 0) - (demographics2?.age || 0));
    const ageSimilarity = 1 - Math.min(ageDifference / 100, 1); // 100 é um valor arbitrário para a diferença máxima de idade
    const genderSimilarity = demographics1?.gender === demographics2?.gender ? 1 : 0;
    const occupationSimilarity = 0//demographics1?.occupation === demographics2?.occupation ? 1 : 0;

    const finalScore = ageSimilarity * 0.01 + genderSimilarity * 0.79 + occupationSimilarity * 0.2;

    return finalScore;
  }
}
