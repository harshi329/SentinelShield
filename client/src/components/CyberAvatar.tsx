/**
 * CyberAvatar — cybersecurity icon avatars + cute emoji avatars.
 * Two categories shown in the Settings avatar picker.
 */
import {
  Shield, Bug, Eye, Lock, Cpu, Zap, Globe, Terminal,
} from "lucide-react";

// ── Avatar definition types ───────────────────────────────────────────────────

interface IconAvatarDef {
  id: string;
  label: string;
  type: "icon";
  icon: React.ElementType;
  gradient: string;
  shadow: string;
}

interface EmojiAvatarDef {
  id: string;
  label: string;
  type: "emoji";
  emoji: string;
  gradient: string;
  shadow: string;
}

export type AvatarDef = IconAvatarDef | EmojiAvatarDef;

// ── Cyber / role-based avatars ────────────────────────────────────────────────

export const CYBER_AVATARS: IconAvatarDef[] = [
  { id: "shield",   label: "Guardian",   type: "icon", icon: Shield,   gradient: "from-sky-500 to-blue-600",      shadow: "shadow-sky-500/40"    },
  { id: "bug",      label: "Bug Hunter", type: "icon", icon: Bug,      gradient: "from-red-500 to-rose-600",      shadow: "shadow-red-500/40"    },
  { id: "eye",      label: "Watcher",    type: "icon", icon: Eye,      gradient: "from-violet-500 to-purple-600", shadow: "shadow-violet-500/40" },
  { id: "lock",     label: "Locksmith",  type: "icon", icon: Lock,     gradient: "from-emerald-500 to-green-600", shadow: "shadow-emerald-500/40"},
  { id: "cpu",      label: "Analyst",    type: "icon", icon: Cpu,      gradient: "from-amber-500 to-orange-500",  shadow: "shadow-amber-500/40"  },
  { id: "zap",      label: "Responder",  type: "icon", icon: Zap,      gradient: "from-yellow-400 to-amber-500",  shadow: "shadow-yellow-400/40" },
  { id: "globe",    label: "NetOps",     type: "icon", icon: Globe,    gradient: "from-teal-500 to-cyan-600",     shadow: "shadow-teal-500/40"   },
  { id: "terminal", label: "Hacker",     type: "icon", icon: Terminal, gradient: "from-slate-600 to-slate-800",   shadow: "shadow-slate-500/40"  },
];

// ── Cute avatars (cyber-themed characters) ────────────────────────────────────

export const CUTE_AVATARS: EmojiAvatarDef[] = [
  { id: "cat",    label: "Cyber Cat",    type: "emoji", emoji: "🐱", gradient: "from-pink-400 to-rose-500",      shadow: "shadow-pink-400/40"   },
  { id: "fox",    label: "Shadow Fox",   type: "emoji", emoji: "🦊", gradient: "from-orange-400 to-amber-500",   shadow: "shadow-orange-400/40" },
  { id: "robot",  label: "Bot Guard",    type: "emoji", emoji: "🤖", gradient: "from-sky-400 to-cyan-500",       shadow: "shadow-sky-400/40"    },
  { id: "alien",  label: "Zero Day",     type: "emoji", emoji: "👾", gradient: "from-violet-500 to-fuchsia-600", shadow: "shadow-violet-500/40" },
  { id: "ninja",  label: "Stealth Ops",  type: "emoji", emoji: "🥷", gradient: "from-slate-700 to-slate-900",    shadow: "shadow-slate-700/40"  },
  { id: "dragon", label: "Fire Wall",    type: "emoji", emoji: "🐉", gradient: "from-red-500 to-orange-600",     shadow: "shadow-red-500/40"    },
  { id: "owl",    label: "Threat Intel", type: "emoji", emoji: "🦉", gradient: "from-teal-500 to-emerald-600",   shadow: "shadow-teal-500/40"   },
  { id: "panda",  label: "White Hat",    type: "emoji", emoji: "🐼", gradient: "from-slate-400 to-slate-600",    shadow: "shadow-slate-400/40"  },
];

export const AVATARS: AvatarDef[] = [...CYBER_AVATARS, ...CUTE_AVATARS];

export const getAvatar = (id: string): AvatarDef =>
  AVATARS.find((a) => a.id === id) ?? AVATARS[0];

// ── Size map ──────────────────────────────────────────────────────────────────

const sizeMap = {
  sm: { wrap: "h-8 w-8 rounded-lg",    iconPx: 14, emojiFontSize: "text-base"  },
  md: { wrap: "h-10 w-10 rounded-xl",  iconPx: 18, emojiFontSize: "text-xl"    },
  lg: { wrap: "h-14 w-14 rounded-2xl", iconPx: 26, emojiFontSize: "text-3xl"   },
  xl: { wrap: "h-20 w-20 rounded-2xl", iconPx: 36, emojiFontSize: "text-4xl"   },
};

// ── CyberAvatar component ─────────────────────────────────────────────────────

interface CyberAvatarProps {
  avatarId: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const CyberAvatar = ({ avatarId, size = "md", className = "" }: CyberAvatarProps) => {
  const av = getAvatar(avatarId);
  const s  = sizeMap[size];

  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-gradient-to-br ${av.gradient} shadow-lg ${av.shadow} ${s.wrap} ${className}`}
    >
      {av.type === "icon" ? (
        <av.icon size={s.iconPx} className="text-white" />
      ) : (
        <span className={`${s.emojiFontSize} leading-none select-none`}>{av.emoji}</span>
      )}
    </div>
  );
};

export default CyberAvatar;
