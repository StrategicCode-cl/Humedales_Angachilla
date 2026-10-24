'use client';

import React, { useEffect, useRef } from 'react';
import { Calendar, Camera, FileText, Heart, Lightbulb, type LucideIcon, QrCode, SquarePen, X } from 'lucide-react';

/** Where the menu opens on large screens: next to the button that opened it */
export type CreateMenuAnchor = { top: number; left?: number; right?: number };

interface CreateMenuProps {
  anchor: CreateMenuAnchor | null;
  onClose: () => void;
  onUploadPhoto: () => void;
  onPublishPost: () => void;
  onSuggestion: () => void;
  onScanQR: () => void;
  onCalendar: () => void;
  onRules: () => void;
  onDonate: () => void;
}

type Item = { id: string; icon: LucideIcon; label: string; hint: string; onSelect: () => void };

/**
 * The "Crear" menu: what a visitor can add to the reserve's app, then shortcuts for the visit.
 * A popover beside its button on large screens, a sheet from the bottom on phones.
 */
export const CreateMenu: React.FC<CreateMenuProps> = ({
  anchor,
  onClose,
  onUploadPhoto,
  onPublishPost,
  onSuggestion,
  onScanQR,
  onCalendar,
  onRules,
  onDonate,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  const groups: { title: string; items: Item[] }[] = [
    {
      title: 'Publicar',
      items: [
        { id: 'mini-btn-pin', icon: Camera, label: 'Subir una foto', hint: 'A la galería de la comunidad', onSelect: onUploadPhoto },
        { id: 'mini-btn-notice', icon: SquarePen, label: 'Escribir en el feed', hint: 'Un avistamiento o una novedad', onSelect: onPublishPost },
        { id: 'mini-btn-suggestion', icon: Lightbulb, label: 'Enviar una idea', hint: 'Al buzón ciudadano', onSelect: onSuggestion },
      ],
    },
    {
      title: 'En la reserva',
      items: [
        { id: 'mini-btn-qr', icon: QrCode, label: 'Escanear un tótem QR', hint: 'Abre la ficha de la estación', onSelect: onScanQR },
        { id: 'mini-btn-events', icon: Calendar, label: 'Ver el calendario', hint: 'Actividades del mes', onSelect: onCalendar },
        { id: 'mini-btn-posters', icon: FileText, label: 'Decálogo y normas', hint: 'Cómo cuidar el humedal', onSelect: onRules },
      ],
    },
  ];

  // Focus the first option, close on Escape, move with the arrow keys
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const options = () => [...panel.querySelectorAll<HTMLButtonElement>('[data-option]')];
    options()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const list = options();
      const i = list.indexOf(document.activeElement as HTMLButtonElement);
      const next = e.key === 'ArrowDown' ? (i + 1) % list.length : (i - 1 + list.length) % list.length;
      list[next]?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const row = (item: Item) => (
    <button
      key={item.id}
      id={item.id}
      type="button"
      data-option
      onClick={() => {
        onClose();
        item.onSelect();
      }}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left hover:bg-stone-100 focus-visible:bg-stone-100 focus-visible:outline-none transition-colors"
    >
      <item.icon className="w-5 h-5 text-stone-500 shrink-0" aria-hidden="true" />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-stone-950">{item.label}</span>
        <span className="block text-[13px] text-stone-600">{item.hint}</span>
      </span>
    </button>
  );

  return (
    <>
      <div id="mini-panel-backdrop" className="fixed inset-0 z-40 bg-stone-950/40 lg:bg-transparent" onClick={onClose} />
      <div
        id="mini-actions-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-menu-title"
        // The anchor only positions the large-screen popover; phones always get the bottom sheet
        style={
          {
            '--menu-top': `${anchor?.top ?? 96}px`,
            '--menu-left': anchor?.left !== undefined ? `${anchor.left}px` : 'auto',
            '--menu-right': anchor?.right !== undefined ? `${anchor.right}px` : 'auto',
          } as React.CSSProperties
        }
        className="fixed z-50 inset-x-0 bottom-0 rounded-t-lg pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:inset-x-auto lg:bottom-auto lg:top-[var(--menu-top)] lg:left-[var(--menu-left)] lg:right-[var(--menu-right)] lg:w-80 lg:rounded-lg lg:pb-2 bg-white text-stone-900 shadow-2xl lg:border lg:border-stone-200 select-none animate-in fade-in slide-in-from-bottom-4 lg:slide-in-from-bottom-0 lg:zoom-in-95 duration-150 motion-reduce:animate-none"
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <h2 id="create-menu-title" className="text-[15px] font-semibold text-stone-950">
            Crear
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-9 h-9 -mr-2 rounded-md flex items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-stone-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-1.5">
          {groups.map(group => (
            <div key={group.title} className="pt-1.5 pb-1">
              <p className="px-3 pb-0.5 text-[13px] text-stone-500">{group.title}</p>
              {group.items.map(row)}
            </div>
          ))}
        </div>

        <div className="mx-4 mt-1 border-t border-stone-200" />
        <div className="px-1.5 pt-1.5">
          <button
            id="mini-btn-donations"
            type="button"
            data-option
            onClick={() => {
              onClose();
              onDonate();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left hover:bg-stone-100 focus-visible:bg-stone-100 focus-visible:outline-none transition-colors"
          >
            <Heart className="w-5 h-5 text-rose-600 shrink-0" aria-hidden="true" />
            <span className="text-sm font-semibold text-stone-950">Donar a la reserva</span>
          </button>
        </div>
      </div>
    </>
  );
};
