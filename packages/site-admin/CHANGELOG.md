## 0.0.1

Initial release of the site-admin package providing a framework for building modern WordPress admin interfaces.

## Core Components

- `SidebarButton`: Base button component for sidebar interactions
- `SidebarContent`: Main sidebar layout component with navigation context
- `SidebarNavigationItem`: Interactive navigation items with icon support
- `SidebarNavigationScreen`: Screen container for sidebar navigation
- `SiteIcon`: Site icon display component

## Routing System
- `RoutesContext`: Context provider for current matched route
- `ConfigContext`: Context for router configuration and settings
- `browserHistory`: Browser history instance for navigation state

### Router Hooks
- `useHistory`: Hook for navigation and history management
- `useLink`: Hook for handling link navigation
- `useLocation`: Hook for accessing current route location
- `useMatch`: Hook for route matching functionality

## Next

- `SiteHub`: Site navigation and context switcher
