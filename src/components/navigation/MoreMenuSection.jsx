import React from "react";
import MoreMenuItem from "@/components/navigation/MoreMenuItem";

export default function MoreMenuSection({ title, items, badges, onClose }) {
  return <section><h2 className="app-section-title mb-2 px-1 text-xs uppercase tracking-[0.12em]">{title}</h2><div className="space-y-2">{items.map(item => <MoreMenuItem key={item.id} item={item} badge={item.badge ? badges[item.badge] : 0} onClose={onClose} />)}</div></section>;
}