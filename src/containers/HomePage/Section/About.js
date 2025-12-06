import React, { Component } from "react";
import { connect } from "react-redux";
import { FormattedMessage } from 'react-intl';


class About extends Component {

    render() {

        return (
            <div className="sections-share section-about">
                <div className="section-about-header">
                    Truyền thông nói gì về website
                </div>
                <div className="section-about-content">
                    <div className="content-left">
                        <iframe
                            width="60%"
                            height="400"
                            src="https://www.youtube.com/embed/FyDQljKtWnI"
                            title="CÀ PHÊ KHỞI NGHIỆP VTV1 - BOOKINGCARE - HỆ THỐNG ĐẶT LỊCH KHÁM TRỰC TUYẾN"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                        ></iframe>
                    </div>
                    <div className="content-right">

                    </div>
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state) => ({
    isLoggedIn: state.user.isLoggedIn,
    language: state.app.language,
});

const mapDispatchToProps = dispatch => {
    return {

    };
};


export default connect(mapStateToProps, mapDispatchToProps)(About);
