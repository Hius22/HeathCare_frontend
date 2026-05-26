import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { Route, Switch } from 'react-router-dom';
import { ConnectedRouter as Router } from 'connected-react-router';
import { history } from '../redux'
import { ToastContainer } from 'react-toastify';
import { userIsAuthenticated, userIsNotAuthenticated, userIsAdmin, userIsDoctor } from '../hoc/authentication';
import { path } from '../utils'
import Home from '../routes/Home';
import Login from './Auth/Login';
import System from '../routes/System';
import Doctor from '../routes/Doctor';
import HomePage from './HomePage/HomePage.js';
import CustomScrollbars from '../components/CustomScrollbars';
import DetailDoctor from './Patient/Doctor/DetailDoctor';
import VerifyEmail from './Patient/VerifyEmail';
import DetailSpecialty from './Patient/Specialty/DetailSpecialty';
import DetailClinic from './Patient/Clinic/DetailClinic';
import AllSpecialty from './Patient/Specialty/AllSpecialty';
import BookingFlow from './Patient/BookingFlow';
import BookingHistory from './Patient/BookingHistory';
import AllDoctors from './Patient/Doctor/AllDoctors';
import AllClinics from './Patient/Clinic/AllClinics';
import NotFound from './NotFound';
import GlobalSpinner from '../components/GlobalSpinner';
class App extends Component {

    handlePersistorState = () => {
        const { persistor } = this.props;
        let { bootstrapped } = persistor.getState();
        if (bootstrapped) {
            if (this.props.onBeforeLift) {
                Promise.resolve(this.props.onBeforeLift())
                    .then(() => this.setState({ bootstrapped: true }))
                    .catch(() => this.setState({ bootstrapped: true }));
            } else {
                this.setState({ bootstrapped: true });
            }
        }
    };

    componentDidMount() {
        this.handlePersistorState();
    }

    render() {
        return (
            <Fragment>
                <Router history={history}>
                    <div className="main-container">
                        <div className="content-container">
                            <CustomScrollbars style={{ height: '100vh', width: '100%' }}>
                                <Switch>
                                    <Route path={path.HOME} exact component={(Home)} />
                                    <Route path={path.LOGIN} component={userIsNotAuthenticated(Login)} />
                                    <Route path={path.SYSTEM} component={userIsAdmin(System)} />
                                    <Route path={'/doctor'} component={userIsDoctor(Doctor)} />

                                    <Route path={path.HOMEPAGE} component={HomePage} />
                                    <Route path={path.DETAIL_DOCTOR} component={DetailDoctor} />
                                    <Route path={path.DETAIL_SPECIALTY} component={DetailSpecialty} />
                                    <Route path={path.DETAIL_CLINIC} component={DetailClinic} />

                                    <Route path={path.VERIFY_EMAIL_BOOKING} component={VerifyEmail} />

                                    <Route path={path.ALL_SPECIALTY} component={AllSpecialty} />

                                    <Route path={path.BOOKING_FLOW} component={BookingFlow} />

                                    <Route path={path.APPOINTMENTS} component={BookingHistory} />

                                    <Route path={path.ALL_DOCTORS} component={AllDoctors} />

                                    <Route path={path.ALL_CLINICS} component={AllClinics} />

                                    <Route component={NotFound} />

                                </Switch>
                            </CustomScrollbars>
                        </div>

                        <ToastContainer
                            position='bottom-right'
                            autoClose={5000}
                            hideProgressBar={false}
                            newestOnTop={false}
                            closeOnClick
                            rtl={false}
                            pauseOnFocusLoss
                            draggable
                            pauseOnHover
                        />
                    </div>
                </Router>
                <GlobalSpinner />
            </Fragment>
        )
    }
}

const mapStateToProps = state => {
    return {
        started: state.app.started,
        isLoggedIn: state.user.isLoggedIn
    };
};

const mapDispatchToProps = dispatch => {
    return {
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(App);