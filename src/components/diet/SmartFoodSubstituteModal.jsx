import React from "react";
import FoodSubstituteModal from "@/components/diet/FoodSubstituteModal";

export default function SmartFoodSubstituteModal({ open, onClose, item, onConfirm }) {
  return <FoodSubstituteModal open={open} onClose={onClose} item={item} onSelect={onConfirm} />;
}