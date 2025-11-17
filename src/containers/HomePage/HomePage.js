import React, { Component } from "react";
import { connect } from "react-redux";
import HomeHeader from "./HomeHeader";
import HomeBody from "./HomeBody";
import HomeFooter from "./HomeFooter";
import "./HomePage.scss";

class HomePage extends Component {
    render() {
        return (
            <div className="home-page-wrapper">
                <HomeHeader />
                <div className="home-body-wrapper">
                    <HomeBody />
                </div>
                <HomeFooter />
            </div>
        );
    }
}

const mapStateToProps = state => ({
    isLoggedIn: state.user.isLoggedIn
});

export default connect(mapStateToProps)(HomePage);
