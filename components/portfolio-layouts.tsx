import { View, FlatList, Dimensions, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { useState } from "react";

type Photo = {
  id: number;
  photoUrl: string;
  caption?: string | null;
};

type LayoutProps = {
  photos: Photo[];
  onPhotoPress?: (photo: Photo, index: number) => void;
};

/**
 * Grid Layout - Classic grid with evenly sized photos
 */
export function GridLayout({ photos, onPhotoPress }: LayoutProps) {
  const screenWidth = Dimensions.get("window").width;
  const numColumns = 3;
  const spacing = 4;
  const photoSize = (screenWidth - spacing * (numColumns + 1)) / numColumns;
  
  return (
    <FlatList
      data={photos}
      numColumns={numColumns}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={{ padding: spacing }}
      columnWrapperStyle={{ gap: spacing }}
      renderItem={({ item, index }) => (
        <TouchableOpacity
          onPress={() => onPhotoPress?.(item, index)}
          style={{ width: photoSize, height: photoSize, marginBottom: spacing }}
        >
          <Image
            source={{ uri: item.photoUrl }}
            style={{ width: "100%", height: "100%", borderRadius: 8 }}
            contentFit="cover"
          />
        </TouchableOpacity>
      )}
    />
  );
}

/**
 * Masonry Layout - Pinterest-style with staggered heights
 */
export function MasonryLayout({ photos, onPhotoPress }: LayoutProps) {
  const screenWidth = Dimensions.get("window").width;
  const numColumns = 2;
  const spacing = 8;
  const columnWidth = (screenWidth - spacing * (numColumns + 1)) / numColumns;
  
  // Split photos into two columns
  const leftColumn = photos.filter((_, index) => index % 2 === 0);
  const rightColumn = photos.filter((_, index) => index % 2 === 1);
  
  const renderColumn = (columnPhotos: Photo[], startIndex: number) => (
    <View style={{ flex: 1, gap: spacing }}>
      {columnPhotos.map((photo, i) => {
        const index = startIndex + i * 2;
        // Vary heights for masonry effect
        const heights = [180, 220, 200, 240, 190, 210];
        const height = heights[i % heights.length];
        
        return (
          <TouchableOpacity
            key={photo.id}
            onPress={() => onPhotoPress?.(photo, index)}
            style={{ width: columnWidth, height, borderRadius: 12, overflow: "hidden" }}
          >
            <Image
              source={{ uri: photo.photoUrl }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
  
  return (
    <View style={{ flexDirection: "row", padding: spacing, gap: spacing }}>
      {renderColumn(leftColumn, 0)}
      {renderColumn(rightColumn, 1)}
    </View>
  );
}

/**
 * Carousel Layout - Swipeable full-width photos
 */
export function CarouselLayout({ photos, onPhotoPress }: LayoutProps) {
  const screenWidth = Dimensions.get("window").width;
  const [activeIndex, setActiveIndex] = useState(0);
  
  const onScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setActiveIndex(roundIndex);
  };
  
  return (
    <View>
      <FlatList
        data={photos}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => onPhotoPress?.(item, index)}
            style={{ width: screenWidth, height: 400, padding: 16 }}
          >
            <Image
              source={{ uri: item.photoUrl }}
              style={{ width: "100%", height: "100%", borderRadius: 16 }}
              contentFit="cover"
            />
          </TouchableOpacity>
        )}
      />
      
      {/* Pagination Dots */}
      <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 16, gap: 8 }}>
        {photos.map((_, index) => (
          <View
            key={index}
            style={{
              width: activeIndex === index ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: activeIndex === index ? "#0a7ea4" : "#ccc",
            }}
          />
        ))}
      </View>
    </View>
  );
}
