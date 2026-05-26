import locationHelperBuilder from "redux-auth-wrapper/history4/locationHelper";
import { connectedRouterRedirect } from "redux-auth-wrapper/history4/redirect";

const locationHelper = locationHelperBuilder({});

export const userIsAuthenticated = connectedRouterRedirect({
    authenticatedSelector: state => state.user.isLoggedIn,
    wrapperDisplayName: 'UserIsAuthenticated',
    redirectPath: '/login'
});

export const userIsNotAuthenticated = connectedRouterRedirect({
    // Want to redirect the user when they are authenticated
    authenticatedSelector: state => !state.user.isLoggedIn,
    wrapperDisplayName: 'UserIsNotAuthenticated',
    redirectPath: (state, ownProps) => locationHelper.getRedirectQueryParam(ownProps) || '/',
    allowRedirectBack: false
});

// Admin only (R1)
export const userIsAdmin = connectedRouterRedirect({
    authenticatedSelector: state =>
        state.user.isLoggedIn && state.user.userInfo && state.user.userInfo.roleId === 'R1',
    wrapperDisplayName: 'UserIsAdmin',
    redirectPath: (state, ownProps) => {
        // Not logged in → go to login
        if (!state.user.isLoggedIn) return '/login';
        // Logged in but wrong role → go to home
        return '/home';
    },
    allowRedirectBack: false
});

// Doctor only (R2)
export const userIsDoctor = connectedRouterRedirect({
    authenticatedSelector: state =>
        state.user.isLoggedIn && state.user.userInfo && state.user.userInfo.roleId === 'R2',
    wrapperDisplayName: 'UserIsDoctor',
    redirectPath: (state, ownProps) => {
        // Not logged in → go to login
        if (!state.user.isLoggedIn) return '/login';
        // Logged in but wrong role → go to home
        return '/home';
    },
    allowRedirectBack: false
});
