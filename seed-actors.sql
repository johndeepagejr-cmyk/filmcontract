-- Sample actor profiles with reviews for testing
-- This script creates 5 sample actors and adds reviews for them

-- Insert sample actors (userRole = 'actor')
INSERT INTO users (name, email, userRole, createdAt, updatedAt) VALUES
('Sarah Johnson', 'sarah.johnson@example.com', 'actor', NOW(), NOW()),
('Michael Chen', 'michael.chen@example.com', 'actor', NOW(), NOW()),
('Emma Rodriguez', 'emma.rodriguez@example.com', 'actor', NOW(), NOW()),
('David Kim', 'david.kim@example.com', 'actor', NOW(), NOW()),
('Lisa Anderson', 'lisa.anderson@example.com', 'actor', NOW(), NOW());

-- Get the IDs of the newly created actors
SET @sarah_id = (SELECT id FROM users WHERE email = 'sarah.johnson@example.com');
SET @michael_id = (SELECT id FROM users WHERE email = 'michael.chen@example.com');
SET @emma_id = (SELECT id FROM users WHERE email = 'emma.rodriguez@example.com');
SET @david_id = (SELECT id FROM users WHERE email = 'david.kim@example.com');
SET @lisa_id = (SELECT id FROM users WHERE email = 'lisa.anderson@example.com');

-- Get a producer ID to use for reviews (assuming there's at least one producer)
SET @producer_id = (SELECT id FROM users WHERE userRole = 'producer' LIMIT 1);

-- Create sample contracts for these actors
INSERT INTO contracts (producerId, actorId, projectTitle, paymentTerms, paymentAmount, startDate, endDate, deliverables, status, createdAt, updatedAt) VALUES
(@producer_id, @sarah_id, 'Feature Film - The Last Stand', 'Payment upon completion', '5000.00', '2024-01-01', '2024-03-01', 'Lead role performance, promotional appearances', 'completed', NOW(), NOW()),
(@producer_id, @sarah_id, 'Commercial - Tech Brand', 'Payment upon completion', '2500.00', '2024-04-01', '2024-04-15', 'Commercial shoot, social media rights', 'completed', NOW(), NOW()),
(@producer_id, @michael_id, 'TV Series - Crime Drama', 'Payment upon completion', '8000.00', '2024-02-01', '2024-05-01', 'Supporting role, 10 episodes', 'completed', NOW(), NOW()),
(@producer_id, @emma_id, 'Independent Film - Coming of Age', 'Payment upon completion', '3000.00', '2024-03-01', '2024-04-01', 'Lead role performance', 'completed', NOW(), NOW()),
(@producer_id, @david_id, 'Voice Over - Animation', 'Payment upon completion', '1500.00', '2024-01-15', '2024-02-15', 'Character voice recording', 'completed', NOW(), NOW()),
(@producer_id, @lisa_id, 'Theater Production - Shakespeare', 'Payment upon completion', '4000.00', '2024-02-01', '2024-03-15', 'Stage performance, rehearsals', 'completed', NOW(), NOW());

-- Get contract IDs
SET @sarah_contract1 = (SELECT id FROM contracts WHERE actorId = @sarah_id AND projectTitle = 'Feature Film - The Last Stand');
SET @sarah_contract2 = (SELECT id FROM contracts WHERE actorId = @sarah_id AND projectTitle = 'Commercial - Tech Brand');
SET @michael_contract = (SELECT id FROM contracts WHERE actorId = @michael_id LIMIT 1);
SET @emma_contract = (SELECT id FROM contracts WHERE actorId = @emma_id LIMIT 1);
SET @david_contract = (SELECT id FROM contracts WHERE actorId = @david_id LIMIT 1);
SET @lisa_contract = (SELECT id FROM contracts WHERE actorId = @lisa_id LIMIT 1);

-- Insert reviews for Sarah Johnson (excellent actor)
INSERT INTO actorReviews (actorId, producerId, contractId, rating, review, professionalismRating, reliabilityRating, wouldHireAgain, createdAt, updatedAt) VALUES
(@sarah_id, @producer_id, @sarah_contract1, 5, 'Sarah was absolutely phenomenal! Her dedication to the role and professionalism on set made the entire production smooth. She came prepared every day and brought incredible energy to her performance. Would definitely work with her again!', 5, 5, true, NOW(), NOW()),
(@sarah_id, @producer_id, @sarah_contract2, 5, 'Perfect for the commercial shoot. Very professional and easy to work with. Nailed every take and was great with the crew.', 5, 5, true, NOW(), NOW());

-- Insert reviews for Michael Chen (very good actor)
INSERT INTO actorReviews (actorId, producerId, contractId, rating, review, professionalismRating, reliabilityRating, wouldHireAgain, createdAt, updatedAt) VALUES
(@michael_id, @producer_id, @michael_contract, 4, 'Michael delivered a solid performance throughout the series. Always on time, knew his lines, and worked well with the cast. A true professional who takes his craft seriously.', 5, 4, true, NOW(), NOW());

-- Insert reviews for Emma Rodriguez (good actor)
INSERT INTO actorReviews (actorId, producerId, contractId, rating, review, professionalismRating, reliabilityRating, wouldHireAgain, createdAt, updatedAt) VALUES
(@emma_id, @producer_id, @emma_contract, 4, 'Emma brought great emotion to the role. She was professional and committed to the project. Had a few scheduling conflicts but we worked through them. Overall a positive experience.', 4, 3, true, NOW(), NOW());

-- Insert reviews for David Kim (reliable voice actor)
INSERT INTO actorReviews (actorId, producerId, contractId, rating, review, professionalismRating, reliabilityRating, wouldHireAgain, createdAt, updatedAt) VALUES
(@david_id, @producer_id, @david_contract, 5, 'David has an amazing voice and incredible range. He nailed the character perfectly and was very easy to direct. Highly recommend for any voice work!', 5, 5, true, NOW(), NOW());

-- Insert reviews for Lisa Anderson (experienced theater actor)
INSERT INTO actorReviews (actorId, producerId, contractId, rating, review, professionalismRating, reliabilityRating, wouldHireAgain, createdAt, updatedAt) VALUES
(@lisa_id, @producer_id, @lisa_contract, 4, 'Lisa brought tremendous stage presence and experience to the production. Her understanding of Shakespeare was evident and she helped elevate the entire cast. Very professional.', 5, 4, true, NOW(), NOW());
