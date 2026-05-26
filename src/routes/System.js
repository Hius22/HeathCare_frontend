import React, { Component } from 'react';
import { connect } from "react-redux";
import { Redirect, Route, Switch } from 'react-router-dom';
import UserRedux from '../containers/System/Admin/UserRedux';
import ManageDoctor from '../containers/System/Admin/ManageDoctor';
import ManageSpecialty from '../containers/System/Specialty/ManageSpecialty';
import ManageClinic from '../containers/System/Clinic/ManageClinic';
import ManageSchedule from '../containers/System/Doctor/ManageSchedule';
import ManageBooking from '../containers/System/Admin/ManageBooking';
import AdminLayout from '../containers/System/Admin/AdminLayout';

class System extends Component {
    render() {
        const { isLoggedIn } = this.props;
        return (
            <React.Fragment>
                {isLoggedIn && (
                    <AdminLayout>
                        <Switch>
                            <Route path="/system/manage-users" component={UserRedux} />
                            <Route path="/system/manage-doctor" component={ManageDoctor} />
                            <Route path="/system/manage-specialty" component={ManageSpecialty} />
                            <Route path="/system/manage-clinic" component={ManageClinic} />
                            <Route path="/system/manage-schedule" component={ManageSchedule} />
                            <Route path="/system/manage-booking" component={ManageBooking} />
                            <Redirect to="/system/manage-booking" />
                        </Switch>
                    </AdminLayout>
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

export default connect(mapStateToProps, mapDispatchToProps)(System);
