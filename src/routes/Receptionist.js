import React, { Component } from 'react';
import { connect } from "react-redux";
import { Redirect, Route, Switch } from 'react-router-dom';
import ReceptionistLayout from '../containers/System/Receptionist/ReceptionistLayout';
import ReceptionistCheckIn from '../containers/System/Receptionist/ReceptionistCheckIn';
import ReceptionistPatients from '../containers/System/Receptionist/ReceptionistPatients';
import ReceptionistBookings from '../containers/System/Receptionist/ReceptionistBookings';
import ReceptionistBilling from '../containers/System/Receptionist/ReceptionistBilling';

class Receptionist extends Component {
    render() {
        const { isLoggedIn } = this.props;
        return (
            <React.Fragment>
                {isLoggedIn && (
                    <ReceptionistLayout>
                        <Switch>
                            <Route path='/receptionist/check-in' component={ReceptionistCheckIn} />
                            <Route path='/receptionist/manage-patient' component={ReceptionistPatients} />
                            <Route path='/receptionist/manage-booking' component={ReceptionistBookings} />
                            <Route path='/receptionist/billing' component={ReceptionistBilling} />
                            <Route render={() => <Redirect to="/receptionist/check-in" />} />
                        </Switch>
                    </ReceptionistLayout>
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
    return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(Receptionist);
