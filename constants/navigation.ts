export interface NavigationItem {
  href: string;
  labelKey: string;
  requiresAuth: boolean;
  variant?: 'ghost' | 'outline' | 'default';
  showInMobile?: boolean;
  showInDesktop?: boolean;
}

export const navigationItems: NavigationItem[] = [
  {
    href: '/listings',
    labelKey: 'listings',
    requiresAuth: false,
    variant: 'ghost',
    showInMobile: true,
    showInDesktop: true,
  },
  {
    href: '/chat',
    labelKey: 'chat',
    requiresAuth: true,
    variant: 'ghost',
    showInMobile: true,
    showInDesktop: true,
  },
  {
    href: '/listings/new',
    labelKey: 'postListing',
    requiresAuth: true,
    variant: 'outline',
    showInMobile: true,
    showInDesktop: true,
  },
];

export const userMenuItems: NavigationItem[] = [
  {
    href: '/account/favorites',
    labelKey: 'favorites',
    requiresAuth: true,
    showInMobile: true,
    showInDesktop: true,
  },
  {
    href: '/account/my-listings',
    labelKey: 'myListings',
    requiresAuth: true,
    showInMobile: true,
    showInDesktop: true,
  },
  {
    href: '/account',
    labelKey: 'settings',
    requiresAuth: true,
    showInMobile: true,
    showInDesktop: true,
  },
];

export const authItems = {
  login: {
    href: '/login',
    labelKey: 'login',
    requiresAuth: false,
    variant: 'outline' as const,
  },
  signup: {
    href: '/signup',
    labelKey: 'signup',
    requiresAuth: false,
    variant: 'default' as const,
  },
};