import { describe, it, expect, beforeAll } from "vitest";
import * as db from "../server/db";

describe("Actor Profile System", () => {
  const testUserId = 999999; // Use a high ID to avoid conflicts

  beforeAll(async () => {
    // Clean up any existing test data
    try {
      await db.deleteActorFilm(1, testUserId);
    } catch (e) {
      // Ignore if doesn't exist
    }
  });

  describe("Actor Profile", () => {
    it("should create and retrieve actor profile", async () => {
      const profileData = {
        bio: "Experienced actor with 10 years in the industry",
        location: "Los Angeles, CA",
        yearsExperience: 10,
        specialties: ["Drama", "Comedy", "Action"],
        height: "6'0\"",
        weight: "180 lbs",
        eyeColor: "Brown",
        hairColor: "Black",
      };

      await db.upsertActorProfile(testUserId, profileData);
      const profile = await db.getActorProfile(testUserId);

      expect(profile).toBeTruthy();
      expect(profile?.bio).toBe(profileData.bio);
      expect(profile?.location).toBe(profileData.location);
      expect(profile?.yearsExperience).toBe(profileData.yearsExperience);
      expect(profile?.specialties).toEqual(profileData.specialties);
      expect(profile?.height).toBe(profileData.height);
    });

    it("should update existing actor profile", async () => {
      const updatedData = {
        bio: "Updated bio with more experience",
        yearsExperience: 15,
      };

      await db.upsertActorProfile(testUserId, updatedData);
      const profile = await db.getActorProfile(testUserId);

      expect(profile?.bio).toBe(updatedData.bio);
      expect(profile?.yearsExperience).toBe(updatedData.yearsExperience);
      // Previous data should still exist
      expect(profile?.location).toBe("Los Angeles, CA");
    });
  });

  describe("Actor Filmography", () => {
    it("should add film to filmography", async () => {
      const filmData = {
        title: "Test Movie",
        role: "Lead Actor",
        year: 2024,
        description: "A test film for the actor profile system",
        projectType: "feature_film" as const,
        director: "Test Director",
        productionCompany: "Test Studios",
      };

      const filmId = await db.addActorFilm(testUserId, filmData);
      expect(filmId).toBeGreaterThan(0);

      const films = await db.getActorFilms(testUserId);
      expect(films.length).toBeGreaterThan(0);
      
      const addedFilm = films.find((f) => f.id === filmId);
      expect(addedFilm).toBeTruthy();
      expect(addedFilm?.title).toBe(filmData.title);
      expect(addedFilm?.role).toBe(filmData.role);
      expect(addedFilm?.year).toBe(filmData.year);
    });

    it("should update film in filmography", async () => {
      const films = await db.getActorFilms(testUserId);
      const testFilm = films[0];

      const updatedData = {
        title: "Updated Test Movie",
        description: "Updated description",
      };

      await db.updateActorFilm(testFilm.id, testUserId, updatedData);
      
      const updatedFilms = await db.getActorFilms(testUserId);
      const updatedFilm = updatedFilms.find((f) => f.id === testFilm.id);
      
      expect(updatedFilm?.title).toBe(updatedData.title);
      expect(updatedFilm?.description).toBe(updatedData.description);
      expect(updatedFilm?.role).toBe(testFilm.role); // Should remain unchanged
    });

    it("should delete film from filmography", async () => {
      const films = await db.getActorFilms(testUserId);
      const filmToDelete = films[0];

      await db.deleteActorFilm(filmToDelete.id, testUserId);
      
      const remainingFilms = await db.getActorFilms(testUserId);
      const deletedFilm = remainingFilms.find((f) => f.id === filmToDelete.id);
      
      expect(deletedFilm).toBeUndefined();
    });

    it("should retrieve films sorted by year descending", async () => {
      // Add multiple films with different years
      await db.addActorFilm(testUserId, {
        title: "Film 2020",
        role: "Actor",
        year: 2020,
        projectType: "feature_film" as const,
      });
      
      await db.addActorFilm(testUserId, {
        title: "Film 2023",
        role: "Actor",
        year: 2023,
        projectType: "feature_film" as const,
      });
      
      await db.addActorFilm(testUserId, {
        title: "Film 2021",
        role: "Actor",
        year: 2021,
        projectType: "feature_film" as const,
      });

      const films = await db.getActorFilms(testUserId);
      
      // Should be sorted by year descending
      expect(films[0].year).toBeGreaterThanOrEqual(films[1].year);
      expect(films[1].year).toBeGreaterThanOrEqual(films[2].year);
    });
  });

  describe("Actor Photos", () => {
    it("should add photo to portfolio", async () => {
      const photoData = {
        photoUrl: "https://example.com/photo1.jpg",
        caption: "Test headshot",
        photoType: "headshot" as const,
      };

      const photoId = await db.addActorPhoto(testUserId, photoData);
      expect(photoId).toBeGreaterThan(0);

      const photos = await db.getActorPhotos(testUserId);
      expect(photos.length).toBeGreaterThan(0);
      
      const addedPhoto = photos.find((p) => p.id === photoId);
      expect(addedPhoto).toBeTruthy();
      expect(addedPhoto?.photoUrl).toBe(photoData.photoUrl);
      expect(addedPhoto?.caption).toBe(photoData.caption);
      expect(addedPhoto?.photoType).toBe(photoData.photoType);
    });

    it("should delete photo from portfolio", async () => {
      const photos = await db.getActorPhotos(testUserId);
      const photoToDelete = photos[0];

      await db.deleteActorPhoto(photoToDelete.id, testUserId);
      
      const remainingPhotos = await db.getActorPhotos(testUserId);
      const deletedPhoto = remainingPhotos.find((p) => p.id === photoToDelete.id);
      
      expect(deletedPhoto).toBeUndefined();
    });
  });
});
