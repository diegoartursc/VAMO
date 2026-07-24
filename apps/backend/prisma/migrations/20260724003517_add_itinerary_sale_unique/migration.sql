-- CreateIndex
CREATE UNIQUE INDEX "itinerary_sales_itineraryId_travelerId_key" ON "itinerary_sales"("itineraryId", "travelerId");
