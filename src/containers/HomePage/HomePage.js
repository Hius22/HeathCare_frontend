import React, { Component } from "react";
import { connect } from "react-redux";
import HomeHeader from "./HomeHeader";
import "./HomePage.scss";
import Hero from "./Section/Hero";
import Specialty from "./Section/Specialty";
import MedicalFacility from "./Section/MedicalFacility";
import OutStandingDoctor from "./Section/OutStandingDoctor";
//import file css cua react-slick
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Testimonials from "./Section/Testimonials";
import About from "./Section/About";
import HomeFooter from "./HomeFooter";

class HomePage extends Component {
    render() {
        let settings = {
            dots: false,
            infinite: false,
            speed: 500,
            slidesToShow: 4,
            slidesToScroll: 1,
        };

        return (
            <div>
                <HomeHeader isShowBanner={false} />
                <Hero />
                <Specialty settings={settings} />
                <OutStandingDoctor settings={settings} />
                <MedicalFacility settings={settings} />
                <Testimonials />
                <About />
                <HomeFooter />
            </div>
        );
    }
}

const mapStateToProps = state => ({
    isLoggedIn: state.user.isLoggedIn
});

const mapDispatchToProps = dispatch => {
    return {
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(HomePage);
