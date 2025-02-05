export interface VideoMetadata {
  id: string;
  videoUrl: string;
  title: string;
  cuisine: string;
  cookingTime: number; // in minutes
  difficulty: "Easy" | "Medium" | "Hard";
  thumbnailUrl: string;
  chef: string;
  description: string;
  ingredients: string[];
  tags: string[];
  likes: number;
  views: number;
}

// Mock data for our test videos
export const TEST_VIDEOS: VideoMetadata[] = [
  {
    id: "1",
    videoUrl:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    title: "Classic Italian Pasta Carbonara",
    cuisine: "Italian",
    cookingTime: 25,
    difficulty: "Medium",
    thumbnailUrl: "https://picsum.photos/seed/pasta1/400/600",
    chef: "Marco Rossi",
    description:
      "Learn how to make authentic Italian carbonara with just eggs, cheese, and guanciale.",
    ingredients: [
      "Spaghetti",
      "Eggs",
      "Pecorino Romano",
      "Guanciale",
      "Black Pepper",
    ],
    tags: ["pasta", "italian", "classic", "creamy"],
    likes: 1243,
    views: 5420,
  },
  {
    id: "2",
    videoUrl:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    title: "Spicy Thai Green Curry",
    cuisine: "Thai",
    cookingTime: 35,
    difficulty: "Medium",
    thumbnailUrl: "https://picsum.photos/seed/curry2/400/600",
    chef: "Siri Patel",
    description:
      "A fragrant and creamy Thai green curry packed with vegetables and chicken.",
    ingredients: [
      "Coconut Milk",
      "Green Curry Paste",
      "Chicken",
      "Thai Basil",
      "Bamboo Shoots",
    ],
    tags: ["curry", "thai", "spicy", "coconut"],
    likes: 892,
    views: 3150,
  },
  {
    id: "3",
    videoUrl:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    title: "Quick Japanese Ramen",
    cuisine: "Japanese",
    cookingTime: 45,
    difficulty: "Hard",
    thumbnailUrl: "https://picsum.photos/seed/ramen3/400/600",
    chef: "Kenji Tanaka",
    description:
      "Master the art of making authentic Japanese ramen with rich tonkotsu broth.",
    ingredients: [
      "Ramen Noodles",
      "Pork Belly",
      "Soy Sauce",
      "Mirin",
      "Green Onions",
    ],
    tags: ["ramen", "japanese", "soup", "umami"],
    likes: 1567,
    views: 6890,
  },
  {
    id: "4",
    videoUrl:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    title: "Mexican Street Tacos",
    cuisine: "Mexican",
    cookingTime: 30,
    difficulty: "Easy",
    thumbnailUrl: "https://picsum.photos/seed/tacos4/400/600",
    chef: "Maria Garcia",
    description:
      "Authentic Mexican street tacos with marinated carne asada and fresh salsa.",
    ingredients: ["Corn Tortillas", "Carne Asada", "Onion", "Cilantro", "Lime"],
    tags: ["tacos", "mexican", "street food", "spicy"],
    likes: 2103,
    views: 8940,
  },
  {
    id: "5",
    videoUrl:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    title: "French Coq au Vin",
    cuisine: "French",
    cookingTime: 90,
    difficulty: "Hard",
    thumbnailUrl: "https://picsum.photos/seed/coq5/400/600",
    chef: "Pierre Dubois",
    description:
      "Classic French chicken braised in wine with mushrooms and pearl onions.",
    ingredients: [
      "Chicken",
      "Red Wine",
      "Mushrooms",
      "Pearl Onions",
      "Bacon Lardons",
    ],
    tags: ["french", "braised", "wine", "classic"],
    likes: 756,
    views: 2890,
  },
  {
    id: "6",
    videoUrl:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    title: "Indian Butter Chicken",
    cuisine: "Indian",
    cookingTime: 50,
    difficulty: "Medium",
    thumbnailUrl: "https://picsum.photos/seed/butter6/400/600",
    chef: "Priya Sharma",
    description:
      "Rich and creamy butter chicken with aromatic spices and tender chicken.",
    ingredients: ["Chicken", "Butter", "Cream", "Tomatoes", "Garam Masala"],
    tags: ["indian", "curry", "creamy", "spicy"],
    likes: 1876,
    views: 7230,
  },
  {
    id: "7",
    videoUrl:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    title: "Korean Bibimbap",
    cuisine: "Korean",
    cookingTime: 40,
    difficulty: "Medium",
    thumbnailUrl: "https://picsum.photos/seed/bibimbap7/400/600",
    chef: "Min-ji Kim",
    description:
      "Colorful and nutritious Korean rice bowl with vegetables and gochujang sauce.",
    ingredients: ["Rice", "Vegetables", "Beef", "Egg", "Gochujang"],
    tags: ["korean", "rice bowl", "healthy", "spicy"],
    likes: 1432,
    views: 5670,
  },
  {
    id: "8",
    videoUrl:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    title: "Greek Moussaka",
    cuisine: "Greek",
    cookingTime: 75,
    difficulty: "Hard",
    thumbnailUrl: "https://picsum.photos/seed/moussaka8/400/600",
    chef: "Elena Papadopoulos",
    description:
      "Traditional Greek moussaka layered with eggplant, meat sauce, and béchamel.",
    ingredients: [
      "Eggplant",
      "Ground Lamb",
      "Béchamel",
      "Tomatoes",
      "Cinnamon",
    ],
    tags: ["greek", "casserole", "comfort food", "baked"],
    likes: 945,
    views: 4120,
  },
  {
    id: "9",
    videoUrl:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
    title: "Vietnamese Pho",
    cuisine: "Vietnamese",
    cookingTime: 180,
    difficulty: "Hard",
    thumbnailUrl: "https://picsum.photos/seed/pho9/400/600",
    chef: "Nguyen Van",
    description:
      "Traditional Vietnamese beef pho with aromatic broth and fresh herbs.",
    ingredients: [
      "Rice Noodles",
      "Beef",
      "Bean Sprouts",
      "Thai Basil",
      "Star Anise",
    ],
    tags: ["vietnamese", "soup", "noodles", "aromatic"],
    likes: 1654,
    views: 6780,
  },
  {
    id: "10",
    videoUrl:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    title: "Spanish Paella",
    cuisine: "Spanish",
    cookingTime: 60,
    difficulty: "Medium",
    thumbnailUrl: "https://picsum.photos/seed/paella10/400/600",
    chef: "Carlos Rodriguez",
    description:
      "Authentic Spanish seafood paella with saffron rice and mixed seafood.",
    ingredients: ["Rice", "Shrimp", "Mussels", "Saffron", "Bell Peppers"],
    tags: ["spanish", "rice", "seafood", "traditional"],
    likes: 1234,
    views: 5430,
  },
];
