"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

import { Category } from "@/types";

interface CategoryBarProps {
  categories: Category[];
  activeCategory: string;
  onSelect: (slug: string) => void;
}

export function CategoryBar({ categories, activeCategory, onSelect }: CategoryBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="py-2">
      <div 
        ref={scrollRef}
        className="no-scrollbar flex items-center gap-3 overflow-x-auto"
      >
        {categories.map((cat) => (
          <motion.button
            key={cat.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(cat.slug)}
            className={cn(
              "whitespace-nowrap rounded-2xl px-6 py-3 text-sm font-bold transition-all duration-300 border",
              activeCategory === cat.slug
                ? "bg-primary border-primary text-black shadow-[0_0_15px_rgba(255,184,0,0.3)]"
                : "bg-surface border-border text-muted hover:border-muted/30"
            )}
          >
            {cat.name}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
