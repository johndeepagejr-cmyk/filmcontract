-- Sample Producers
INSERT INTO users (openId, name, email, userRole, isVerified, createdAt, updatedAt, lastSignedIn) VALUES
('demo_prod_1', 'Sarah Mitchell', 'sarah@silverstudios.com', 'producer', 1, NOW(), NOW(), NOW()),
('demo_prod_2', 'James Rodriguez', 'james@indiefilms.com', 'producer', 1, NOW(), NOW(), NOW()),
('demo_prod_3', 'Emily Chen', 'emily@commercialking.com', 'producer', 1, NOW(), NOW(), NOW()),
('demo_prod_4', 'Michael Thompson', 'michael@docuworld.com', 'producer', 1, NOW(), NOW(), NOW()),
('demo_prod_5', 'Lisa Anderson', 'lisa@tvnetwork.com', 'producer', 1, NOW(), NOW(), NOW()),
('demo_prod_6', 'David Park', 'david@webmedia.com', 'producer', 1, NOW(), NOW(), NOW()),
('demo_prod_7', 'Rachel Green', 'rachel@musicvideo.com', 'producer', 1, NOW(), NOW(), NOW()),
('demo_prod_8', 'Tom Wilson', 'tom@corporatepro.com', 'producer', 1, NOW(), NOW(), NOW());

-- Sample Actors
INSERT INTO users (openId, name, email, userRole, isVerified, createdAt, updatedAt, lastSignedIn) VALUES
('demo_actor_1', 'Alex Johnson', 'alex.actor@gmail.com', 'actor', 1, NOW(), NOW(), NOW()),
('demo_actor_2', 'Maria Garcia', 'maria.g@acting.com', 'actor', 1, NOW(), NOW(), NOW()),
('demo_actor_3', 'Chris Lee', 'chris.lee@talent.com', 'actor', 1, NOW(), NOW(), NOW()),
('demo_actor_4', 'Jessica Brown', 'jess.brown@actors.com', 'actor', 1, NOW(), NOW(), NOW()),
('demo_actor_5', 'Ryan Davis', 'ryan.d@film.com', 'actor', 1, NOW(), NOW(), NOW()),
('demo_actor_6', 'Sophia Martinez', 'sophia.m@talent.com', 'actor', 1, NOW(), NOW(), NOW()),
('demo_actor_7', 'Daniel Kim', 'daniel.kim@acting.com', 'actor', 1, NOW(), NOW(), NOW()),
('demo_actor_8', 'Olivia White', 'olivia.w@voiceover.com', 'actor', 1, NOW(), NOW(), NOW()),
('demo_actor_9', 'Marcus Johnson', 'marcus.j@commercial.com', 'actor', 1, NOW(), NOW(), NOW()),
('demo_actor_10', 'Emma Taylor', 'emma.t@theater.com', 'actor', 1, NOW(), NOW(), NOW());

-- Producer Profiles
INSERT INTO producerProfiles (userId, companyName, bio, location, website, specialties, createdAt, updatedAt)
SELECT id, 
  CASE 
    WHEN name = 'Sarah Mitchell' THEN 'Silver Screen Studios'
    WHEN name = 'James Rodriguez' THEN 'Indie Vision Productions'
    WHEN name = 'Emily Chen' THEN 'Commercial Kings'
    WHEN name = 'Michael Thompson' THEN 'Documentary World'
    WHEN name = 'Lisa Anderson' THEN 'Prime Time Productions'
    WHEN name = 'David Park' THEN 'Digital Media Co'
    WHEN name = 'Rachel Green' THEN 'Rhythm & Vision'
    WHEN name = 'Tom Wilson' THEN 'Corporate Media Solutions'
  END as companyName,
  CASE 
    WHEN name = 'Sarah Mitchell' THEN 'Experienced feature films producer based in Los Angeles, CA'
    WHEN name = 'James Rodriguez' THEN 'Experienced indie films producer based in Austin, TX'
    WHEN name = 'Emily Chen' THEN 'Experienced commercials producer based in New York, NY'
    WHEN name = 'Michael Thompson' THEN 'Experienced documentaries producer based in San Francisco, CA'
    WHEN name = 'Lisa Anderson' THEN 'Experienced tv series producer based in Los Angeles, CA'
    WHEN name = 'David Park' THEN 'Experienced web content producer based in Seattle, WA'
    WHEN name = 'Rachel Green' THEN 'Experienced music videos producer based in Nashville, TN'
    WHEN name = 'Tom Wilson' THEN 'Experienced corporate videos producer based in Chicago, IL'
  END as bio,
  CASE 
    WHEN name = 'Sarah Mitchell' THEN 'Los Angeles, CA'
    WHEN name = 'James Rodriguez' THEN 'Austin, TX'
    WHEN name = 'Emily Chen' THEN 'New York, NY'
    WHEN name = 'Michael Thompson' THEN 'San Francisco, CA'
    WHEN name = 'Lisa Anderson' THEN 'Los Angeles, CA'
    WHEN name = 'David Park' THEN 'Seattle, WA'
    WHEN name = 'Rachel Green' THEN 'Nashville, TN'
    WHEN name = 'Tom Wilson' THEN 'Chicago, IL'
  END as location,
  CONCAT('https://www.', LOWER(REPLACE(name, ' ', '')), '.com') as website,
  JSON_ARRAY(
    CASE 
      WHEN name = 'Sarah Mitchell' THEN 'Feature Films'
      WHEN name = 'James Rodriguez' THEN 'Indie Films'
      WHEN name = 'Emily Chen' THEN 'Commercials'
      WHEN name = 'Michael Thompson' THEN 'Documentaries'
      WHEN name = 'Lisa Anderson' THEN 'TV Series'
      WHEN name = 'David Park' THEN 'Web Content'
      WHEN name = 'Rachel Green' THEN 'Music Videos'
      WHEN name = 'Tom Wilson' THEN 'Corporate Videos'
    END
  ) as specialties,
  NOW(), NOW()
FROM users WHERE userRole = 'producer' AND openId LIKE 'demo_prod_%';

-- Actor Profiles
INSERT INTO actorProfiles (userId, bio, specialties, yearsOfExperience, location, height, weight, eyeColor, hairColor, createdAt, updatedAt)
SELECT id,
  CASE 
    WHEN name = 'Alex Johnson' THEN 'Versatile dramatic actor with theater background'
    WHEN name = 'Maria Garcia' THEN 'Stand-up comedian turned film actor'
    WHEN name = 'Chris Lee' THEN 'Stunt performer and action specialist'
    WHEN name = 'Jessica Brown' THEN 'Scream queen with cult following'
    WHEN name = 'Ryan Davis' THEN 'Method actor specializing in psychological roles'
    WHEN name = 'Sophia Martinez' THEN 'Romantic lead with classical training'
    WHEN name = 'Daniel Kim' THEN 'Tech-savvy actor perfect for futuristic roles'
    WHEN name = 'Olivia White' THEN 'Award-winning voice actor for animation and commercials'
    WHEN name = 'Marcus Johnson' THEN 'Fresh face perfect for brand campaigns'
    WHEN name = 'Emma Taylor' THEN 'Broadway veteran transitioning to film'
  END as bio,
  JSON_ARRAY(
    CASE 
      WHEN name = 'Alex Johnson' THEN 'Drama'
      WHEN name = 'Maria Garcia' THEN 'Comedy'
      WHEN name = 'Chris Lee' THEN 'Action'
      WHEN name = 'Jessica Brown' THEN 'Horror'
      WHEN name = 'Ryan Davis' THEN 'Thriller'
      WHEN name = 'Sophia Martinez' THEN 'Romance'
      WHEN name = 'Daniel Kim' THEN 'Sci-Fi'
      WHEN name = 'Olivia White' THEN 'Voice-Over'
      WHEN name = 'Marcus Johnson' THEN 'Commercial'
      WHEN name = 'Emma Taylor' THEN 'Theater'
    END
  ) as specialties,
  FLOOR(3 + RAND() * 12) as yearsOfExperience,
  CASE FLOOR(RAND() * 3)
    WHEN 0 THEN 'Los Angeles, CA'
    WHEN 1 THEN 'New York, NY'
    ELSE 'Atlanta, GA'
  END as location,
  CONCAT(FLOOR(60 + RAND() * 12), '"') as height,
  CONCAT(FLOOR(120 + RAND() * 60), ' lbs') as weight,
  CASE FLOOR(RAND() * 4)
    WHEN 0 THEN 'Brown'
    WHEN 1 THEN 'Blue'
    WHEN 2 THEN 'Green'
    ELSE 'Hazel'
  END as eyeColor,
  CASE FLOOR(RAND() * 4)
    WHEN 0 THEN 'Black'
    WHEN 1 THEN 'Brown'
    WHEN 2 THEN 'Blonde'
    ELSE 'Red'
  END as hairColor,
  NOW(), NOW()
FROM users WHERE userRole = 'actor' AND openId LIKE 'demo_actor_%';

-- Producer Reputation
INSERT INTO producerReputation (producerId, totalContracts, completedContracts, avgRating, onTimePaymentRate, wouldWorkAgainRate, createdAt, updatedAt)
SELECT id,
  FLOOR(10 + RAND() * 40) as totalContracts,
  FLOOR(8 + RAND() * 32) as completedContracts,
  ROUND(3.5 + RAND() * 1.5, 1) as avgRating,
  FLOOR(80 + RAND() * 20) as onTimePaymentRate,
  FLOOR(75 + RAND() * 25) as wouldWorkAgainRate,
  NOW(), NOW()
FROM users WHERE userRole = 'producer' AND openId LIKE 'demo_prod_%';

-- Actor Reputation
INSERT INTO actorReputation (actorId, totalContracts, completedContracts, avgRating, onTimeRate, professionalismScore, wouldHireAgainRate, createdAt, updatedAt)
SELECT id,
  FLOOR(5 + RAND() * 35) as totalContracts,
  FLOOR(4 + RAND() * 31) as completedContracts,
  ROUND(3.5 + RAND() * 1.5, 1) as avgRating,
  FLOOR(80 + RAND() * 20) as onTimeRate,
  ROUND(3.5 + RAND() * 1.5, 1) as professionalismScore,
  FLOOR(75 + RAND() * 25) as wouldHireAgainRate,
  NOW(), NOW()
FROM users WHERE userRole = 'actor' AND openId LIKE 'demo_actor_%';

-- Sample Contracts
INSERT INTO contracts (producerId, actorId, projectTitle, role, startDate, endDate, paymentAmount, paymentTerms, status, terms, producerSigned, actorSigned, createdAt, updatedAt)
SELECT 
  p.id as producerId,
  a.id as actorId,
  CONCAT(
    CASE FLOOR(RAND() * 4)
      WHEN 0 THEN 'Feature Film'
      WHEN 1 THEN 'TV Series'
      WHEN 2 THEN 'Commercial'
      ELSE 'Documentary'
    END,
    ' Project ', FLOOR(RAND() * 100)
  ) as projectTitle,
  CASE FLOOR(RAND() * 4)
    WHEN 0 THEN 'Lead Actor'
    WHEN 1 THEN 'Supporting Role'
    WHEN 2 THEN 'Day Player'
    ELSE 'Featured Extra'
  END as role,
  DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 60 - 30) DAY) as startDate,
  DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 60) DAY) as endDate,
  CASE FLOOR(RAND() * 4)
    WHEN 0 THEN '50000'
    WHEN 1 THEN '15000'
    WHEN 2 THEN '2500'
    ELSE '5000'
  END as paymentAmount,
  'Net 30' as paymentTerms,
  CASE FLOOR(RAND() * 4)
    WHEN 0 THEN 'pending'
    WHEN 1 THEN 'active'
    WHEN 2 THEN 'completed'
    ELSE 'cancelled'
  END as status,
  'Standard contract terms and conditions apply.' as terms,
  RAND() > 0.3 as producerSigned,
  RAND() > 0.5 as actorSigned,
  NOW(), NOW()
FROM 
  (SELECT id FROM users WHERE userRole = 'producer' AND openId LIKE 'demo_prod_%' ORDER BY RAND() LIMIT 30) p
  CROSS JOIN
  (SELECT id FROM users WHERE userRole = 'actor' AND openId LIKE 'demo_actor_%' ORDER BY RAND() LIMIT 1) a;
