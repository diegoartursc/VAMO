import React from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import {
    // Navigation
    Home,
    Map,
    User,
    Search,
    Plane,
    Menu,
    X,
    ChevronRight,
    ChevronLeft,
    ChevronDown,
    Filter,
    // Travel & Accommodation
    Hotel,
    Coffee,
    Car,
    Ship,
    Luggage,
    Compass,
    Navigation,
    Globe,
    MapPin,
    Mountain,
    Trees,
    Sun,
    // Actions & Status
    Heart,
    HeartPulse,
    Star,
    Share2,
    Bell,
    Edit,
    Lock,
    // Trust & Verification
    CheckCircle2,
    ShieldCheck,
    CheckSquare,
    Award,
    // Finance & Categories
    CreditCard,
    Gem,
    PiggyBank,
    Wallet,
    Trophy,
    Landmark,
    Utensils,
    Lightbulb,
    // People
    Users,
    CircleUserRound,
    // Communication
    Phone,
    Mail,
    LogOut,
    Info,
    MoreHorizontal,
    // Content
    HelpCircle,
    FileText,
    Settings,
    Image as ImageIcon,
    Camera,
    BookOpen,
    Calendar,
    Clock,
    Briefcase,
    Backpack,
    // Profile & My-Trips
    Palette,
    Trash2,
    ClipboardList,
    MessageCircle,
    Eye,
    Download,
    RefreshCw,
    ShoppingCart,
    PartyPopper,
} from 'lucide-react-native';
import { theme } from '../../theme/theme';

export type IconName =
    | 'home' | 'package' | 'map' | 'trips' | 'user'
    | 'search' | 'plane' | 'hotel' | 'coffee' | 'car' | 'ship'
    | 'verified' | 'shield-check' | 'check-square' | 'award'
    | 'star' | 'chevron-right' | 'chevron-left' | 'chevron-down'
    | 'filter' | 'calendar' | 'clock' | 'menu' | 'close'
    | 'heart' | 'heart-pulse' | 'share' | 'phone' | 'mail' | 'logout'
    | 'card' | 'globe' | 'help' | 'file' | 'settings' | 'info'
    | 'image' | 'camera' | 'location' | 'compass' | 'navigation'
    | 'gem' | 'piggy-bank' | 'wallet' | 'trophy' | 'landmark'
    | 'utensils' | 'lightbulb' | 'mountain' | 'trees' | 'sun'
    | 'users' | 'circle-user' | 'bell' | 'edit' | 'lock'
    | 'book-open' | 'briefcase' | 'backpack' | 'more-horizontal'
    | 'palette' | 'trash' | 'clipboard-list' | 'message-circle'
    | 'eye' | 'download' | 'refresh' | 'shopping-cart' | 'party-popper';

interface IconProps {
    name: IconName;
    size?: number;
    color?: string;
    style?: StyleProp<ViewStyle>;
    strokeWidth?: number;
}

// Icon Mapping — VAMO 2.0 Complete System
const ICON_MAP: Record<string, any> = {
    // Navigation
    home: Home,
    package: Plane,
    map: Map,
    trips: Luggage,
    user: User,
    search: Search,
    menu: Menu,
    close: X,
    'chevron-right': ChevronRight,
    'chevron-left': ChevronLeft,
    'chevron-down': ChevronDown,
    filter: Filter,

    // Travel & Accommodation
    plane: Plane,
    hotel: Hotel,
    coffee: Coffee,
    car: Car,
    ship: Ship,
    compass: Compass,
    navigation: Navigation,
    globe: Globe,
    location: MapPin,
    mountain: Mountain,
    trees: Trees,
    sun: Sun,

    // Actions & Status
    heart: Heart,
    'heart-pulse': HeartPulse,
    star: Star,
    share: Share2,
    bell: Bell,
    edit: Edit,
    lock: Lock,

    // Trust & Verification
    verified: CheckCircle2,
    'shield-check': ShieldCheck,
    'check-square': CheckSquare,
    award: Award,

    // Finance & Categories
    card: CreditCard,
    gem: Gem,
    'piggy-bank': PiggyBank,
    wallet: Wallet,
    trophy: Trophy,
    landmark: Landmark,
    utensils: Utensils,
    lightbulb: Lightbulb,

    // People
    users: Users,
    'circle-user': CircleUserRound,

    // Communication
    phone: Phone,
    mail: Mail,
    logout: LogOut,
    info: Info,
    'more-horizontal': MoreHorizontal,

    // Content
    help: HelpCircle,
    file: FileText,
    settings: Settings,
    image: ImageIcon,
    camera: Camera,
    'book-open': BookOpen,
    calendar: Calendar,
    clock: Clock,
    briefcase: Briefcase,
    backpack: Backpack,
    // Profile & Settings
    palette: Palette,
    trash: Trash2,
    'clipboard-list': ClipboardList,
    'message-circle': MessageCircle,
    eye: Eye,
    download: Download,
    refresh: RefreshCw,
    'shopping-cart': ShoppingCart,
    'party-popper': PartyPopper,
};

export const Icon: React.FC<IconProps> = ({
    name,
    size = 24,
    color = theme.colors.text.primary,
    style,
    strokeWidth = 1.5 // VAMO 2.0 Standard: Thin & Elegant
}) => {
    const IconComponent = ICON_MAP[name] || HelpCircle;

    return (
        <IconComponent
            size={size}
            color={color}
            style={style}
            strokeWidth={strokeWidth}
        />
    );
};
