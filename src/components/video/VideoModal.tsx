"use client";

import { Dialog, Transition } from "@headlessui/react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { Fragment, useState } from "react";
import { VideoPlayer } from "./VideoPlayer";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
  video: {
    title: string;
    chef?: string;
    difficulty: string;
    cookingTime: number;
    description: string;
    cuisine: string;
    tags: string[];
  };
}

export function VideoModal({
  isOpen,
  onClose,
  videoUrl,
  video,
}: VideoModalProps) {
  const [showDescription, setShowDescription] = useState(true);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/75" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-800 shadow-xl transition-all">
                <div className="relative">
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 focus:outline-none transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>

                  <VideoPlayer
                    videoUrl={videoUrl}
                    autoPlay={true}
                    muted={false}
                    loop={true}
                  />

                  {/* Content Overlays */}
                  <div className="absolute inset-0 flex flex-col pointer-events-none">
                    {/* Top Gradient */}
                    <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 to-transparent" />

                    {/* Bottom Gradient and Content */}
                    <div
                      className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-all duration-300 ease-in-out ${
                        showDescription ? "h-64" : "h-24"
                      }`}
                    >
                      {/* Toggle Button */}
                      <button
                        onClick={() => setShowDescription(!showDescription)}
                        className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/50 rounded-full p-1.5 pointer-events-auto hover:bg-black/70 transition-colors z-10"
                      >
                        {showDescription ? (
                          <ChevronDownIcon className="w-5 h-5 text-white" />
                        ) : (
                          <ChevronUpIcon className="w-5 h-5 text-white" />
                        )}
                      </button>

                      {/* Video Metadata */}
                      <div
                        className={`absolute inset-x-0 bottom-16 px-4 space-y-2 transition-opacity duration-300 ${
                          showDescription
                            ? "opacity-100"
                            : "opacity-0 pointer-events-none"
                        }`}
                      >
                        {/* Title and Chef */}
                        <div className="flex items-start justify-between">
                          <div>
                            <h2 className="text-lg font-bold text-white">
                              {video.title}
                            </h2>
                            {video.chef && (
                              <p className="text-sm text-white/90">
                                by {video.chef}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 bg-black/50 px-2 py-1 rounded">
                            <span className="text-sm text-white capitalize">
                              {video.difficulty}
                            </span>
                            <span className="text-white">•</span>
                            <span className="text-sm text-white">
                              {video.cookingTime}min
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-white/90 line-clamp-2">
                          {video.description}
                        </p>

                        {/* Cuisine */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm bg-black/50 px-2 py-1 rounded text-white">
                            {video.cuisine}
                          </span>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 pb-2">
                          {video.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-white/20 px-2 py-0.5 rounded-full text-white"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
