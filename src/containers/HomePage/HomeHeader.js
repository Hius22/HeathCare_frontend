import React, { Component } from "react";
import { connect } from "react-redux";
import "./HomeHeader.scss";
import logo from '../../assets/logo.svg';
import { FormattedMessage } from 'react-intl';
import { LANGUAGES } from "../../utils";
import { changeLanguageApp } from "../../store/actions";
class HomeHeader extends Component {

    changeLanguage = (language) => {
        this.props.changeLanguageAppRedux(language)
        //fire redux event: actions

    }

    render() {
        let language = this.props.language;
        console.log('check lang: ', language)
        return (
            <React.Fragment>
                <div className="home-header-container">
                    <div className="home-header-content">
                        <div className="left-content">
                            <i class="fa-solid fa-bars"></i>
                            <img className="header-logo" src={logo} />
                        </div>
                        <div className="center-content">
                            <div className="child-content">
                                <div><b><FormattedMessage id="homeheader.specialty" /></b></div>
                                <div className="subs-title"><FormattedMessage id="homeheader.search-doctor" /></div>
                            </div>
                            <div className="child-content">
                                <div><b><FormattedMessage id="homeheader.medical-facilities" /></b></div>
                                <div className="subs-title"><FormattedMessage id="homeheader.select-clinic" /></div>
                            </div>
                            <div className="child-content">
                                <div><b><FormattedMessage id="homeheader.doctor" /></b></div>
                                <div className="subs-title"><FormattedMessage id="homeheader.choose-doctor" /></div>
                            </div>
                            <div className="child-content">
                                <div><b><FormattedMessage id="homeheader.package" /></b></div>
                                <div className="subs-title"><FormattedMessage id="homeheader.health-check" /></div>
                            </div>
                        </div>
                        <div className="right-content">
                            <div className="support"><i className="fa-solid fa-circle-question"></i><FormattedMessage id="homeheader.support" /></div>
                            <div className={language === LANGUAGES.VI ? 'language-vi active' : 'language-vi'}><span onClick={() => this.changeLanguage(LANGUAGES.VI)}>VN</span></div>
                            <div className={language === LANGUAGES.EN ? 'language-en active' : 'language-en'}><span onClick={() => this.changeLanguage(LANGUAGES.EN)}>EN</span></div>
                        </div>
                    </div>
                </div>

                <div className="home-header-banner">
                    <div className="content-up">
                        <div className="title1"><FormattedMessage id="banner.title1" /></div>
                        <div className="title2"><FormattedMessage id="banner.title2" /></div>
                        <div className="search">
                            <i className="fa-solid fa-magnifying-glass"></i>
                            <input type="text" placeholder="Tìm chuyên khoa khám bệnh" />
                        </div>
                    </div>
                    <div className="content-down">
                        <div className="options">
                            <div className="option-child">
                                <div className="icon-child"><i class="fa-solid fa-hospital"></i></div>
                                <div className="text-child"><FormattedMessage id="banner.specialist-examination" /></div>
                            </div>
                            <div className="option-child">
                                <div className="icon-child"><i className="fa-solid fa-mobile-screen"></i></div>
                                <div className="text-child"><FormattedMessage id="banner.remote-examination" /></div>
                            </div>
                            <div className="option-child">
                                <div className="icon-child"><i className="fa-solid fa-bed"></i></div>
                                <div className="text-child"><FormattedMessage id="banner.general-examination" /></div>
                            </div>
                            <div className="option-child">
                                <div className="icon-child"><i className="fa-solid fa-microscope"></i></div>
                                <div className="text-child"><FormattedMessage id="banner.medical-tests" /></div>
                            </div>
                            <div className="option-child">
                                <div className="icon-child"><i className="fa-solid fa-user-doctor"></i></div>
                                <div className="text-child"><FormattedMessage id="banner.mental-health" /></div>
                            </div>
                            <div className="option-child">
                                <div className="icon-child"><i className="fa-solid fa-tooth"></i></div>
                                <div className="text-child"><FormattedMessage id="banner.dental-examination" /></div>
                            </div>
                        </div>
                    </div>

                </div>
            </React.Fragment>
        )
    }
}

const mapStateToProps = (state) => ({
    isLoggedIn: state.user.isLoggedIn,
    language: state.app.language,
});

const mapDispatchToProps = dispatch => {
    return {
        changeLanguageAppRedux: (language) => dispatch(changeLanguageApp(language))
    };
};


export default connect(mapStateToProps, mapDispatchToProps)(HomeHeader);
