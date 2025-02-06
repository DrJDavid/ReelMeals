"use client";

export function Logo({ showTagline = false, className = "" }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
        ReelMeals
      </h1>
      {showTagline && (
        <p className="text-sm text-gray-400 mt-1">Discover delicious recipes</p>
      )}
    </div>
  );
}
