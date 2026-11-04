-- CreateIndex
CREATE INDEX "itineraries_creatorId_idx" ON "itineraries"("creatorId");

-- CreateIndex
CREATE INDEX "itinerary_images_itineraryId_idx" ON "itinerary_images"("itineraryId");

-- CreateIndex
CREATE INDEX "itinerary_days_itineraryId_idx" ON "itinerary_days"("itineraryId");

-- CreateIndex
CREATE INDEX "itinerary_activities_dayId_idx" ON "itinerary_activities"("dayId");

-- CreateIndex
CREATE INDEX "itinerary_sales_travelerId_idx" ON "itinerary_sales"("travelerId");

-- CreateIndex
CREATE INDEX "reviews_itineraryId_idx" ON "reviews"("itineraryId");

-- CreateIndex
CREATE INDEX "faq_questions_itineraryId_idx" ON "faq_questions"("itineraryId");

