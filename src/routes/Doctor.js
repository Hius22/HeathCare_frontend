import React, { Component } from 'react';
import { connect } from "react-redux";
import { Redirect, Route, Switch } from 'react-router-dom';
// import ManageSchedule from '../containers/System/Doctor/ManageSchedule';
// import Header from '../containers/Header/Header';
import ManagePatient from '../containers/System/Doctor/ManagePatient';
import ManageScheduleDoctor from '../containers/System/Doctor/ManageScheduleForDoctor';
import DoctorLayout from '../containers/System/Doctor/DoctorLayout';
import DoctorDashboard from '../containers/System/Doctor/DoctorDashboard';
import DoctorProfile from '../containers/System/Doctor/DoctorProfile';

class Doctor extends Component {
    render() {
        const { isLoggedIn } = this.props;
        return (
            <React.Fragment>
                {isLoggedIn && (
                    <DoctorLayout>
                        <Switch>
                            <Route path='/doctor/dashboard' component={DoctorDashboard} />
                            <Route path='/doctor/manage-schedule-doctor' component={ManageScheduleDoctor} />
                            <Route path='/doctor/manage-patient' component={ManagePatient} />
                            <Route path='/doctor/profile' component={DoctorProfile} />
                            {/* Default redirect to dashboard */}
                            <Route render={() => <Redirect to="/doctor/dashboard" />} />
                        </Switch>
                    </DoctorLayout>
                )}
            </React.Fragment>
        );
    }
}

const mapStateToProps = state => {
    return {
        isLoggedIn: state.user.isLoggedIn,
    };
};

const mapDispatchToProps = dispatch => {
    return {
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Doctor);
