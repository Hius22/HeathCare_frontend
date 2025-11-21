import React, { Component } from 'react';
import { connect } from 'react-redux';

import * as actions from "../../store/actions";
import Navigator from '../../components/Navigator';
import { adminMenu } from './menuApp';
import './Header.scss';
import { LANGUAGES } from '../../utils';
import { lang } from 'moment/moment';
class Header extends Component {

    handleChangeLanguages = (language) => {
        this.props.changeLanguageAppRedux(language)
    }

    render() {
        const { processLogout, language, userInfo } = this.props;
        console.log('check', userInfo)
        return (
            <div className="header-container">
                {/* thanh navigator */}
                <div className="header-tabs-container">
                    <Navigator menus={adminMenu} />
                </div>

                <div className='languages'>
                    <span className='welcome'>Welcome, {userInfo && userInfo.firstName ? userInfo.firstName : ''}</span>
                    <span className={language === LANGUAGES.VI ? "languages-vi active" : "languages-vi"}
                        onClick={() => this.handleChangeLanguages(LANGUAGES.VI)}
                    >
                        VN
                    </span>
                    <span className={language === LANGUAGES.EN ? "languages-en active" : "languages-en"}
                        onClick={() => this.handleChangeLanguages(LANGUAGES.EN)}
                    >
                        EN
                    </span>
                    <div className="btn btn-logout" onClick={processLogout} title='Log out'>
                        <i className="fas fa-sign-out-alt"></i>
                    </div>
                </div>

                {/* nút logout */}

            </div>
        );
    }

}

const mapStateToProps = state => {
    return {
        isLoggedIn: state.user.isLoggedIn,
        language: state.app.language,
        userInfo: state.user.userInfo,
    };
};

const mapDispatchToProps = dispatch => {
    return {
        processLogout: () => dispatch(actions.processLogout()),
        changeLanguageAppRedux: (language) => dispatch(actions.changeLanguageApp(language))
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Header);
