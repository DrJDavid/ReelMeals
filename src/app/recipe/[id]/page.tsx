import { RecipePageContent } from "@/components/recipe/RecipePageContent";

// Generate a few test recipe pages for initial static build
export function generateStaticParams() {
  return [
    { id: "test-recipe-1" },
    { id: "test-recipe-2" },
    { id: "test-recipe-3" },
  ];
}

export default function RecipePage() {
  return <RecipePageContent />;
}
