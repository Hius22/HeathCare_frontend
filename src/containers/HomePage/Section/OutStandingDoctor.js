import React, { Component } from "react";
import { connect } from "react-redux";
import { FormattedMessage } from 'react-intl';
import Slider from "react-slick";

class OutStandingDoctor extends Component {
    render() {
        return (
            <div>
                <div className="sections-share  section-outstanding-doctor">
                    <div className=" section-container">
                        <div className="section-header">
                            <span className="title-section">Bác sỹ nổi bật tuần qua</span>
                            <button className="btn-section">Xem thêm</button>
                        </div>

                        <div className="section-body">
                            <Slider {...this.props.settings}>
                                <div className="section-customize">
                                    <div className="customize-border">
                                        <div className="outer-bg">
                                            <div className="bg-image section-outstanding-doctor" />
                                        </div>
                                        <div className="position text-center">
                                            <div>Giáo sư, Bác sĩ Phạm Chí Lăng 1</div>
                                            <div>Cơ Xương Khớp,Chấn thương chỉnh hình</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="section-customize">
                                    <div className="customize-border">
                                        <div className="outer-bg">
                                            <div className="bg-image section-outstanding-doctor" />
                                        </div>
                                        <div className="position text-center">
                                            <div>Giáo sư, Bác sĩ Phạm Chí Lăng 2</div>
                                            <div>Cơ Xương Khớp,Chấn thương chỉnh hình</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="section-customize">
                                    <div className="customize-border">
                                        <div className="outer-bg">
                                            <div className="bg-image section-outstanding-doctor" />
                                        </div>
                                        <div className="position text-center">
                                            <div>Giáo sư, Bác sĩ Phạm Chí Lăng 3</div>
                                            <div>Cơ Xương Khớp,Chấn thương chỉnh hình</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="section-customize">
                                    <div className="customize-border">
                                        <div className="outer-bg">
                                            <div className="bg-image section-outstanding-doctor" />
                                        </div>
                                        <div className="position text-center">
                                            <div>Giáo sư, Bác sĩ Phạm Chí Lăng 4</div>
                                            <div>Cơ Xương Khớp,Chấn thương chỉnh hình</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="section-customize">
                                    <div className="customize-border">
                                        <div className="outer-bg">
                                            <div className="bg-image section-outstanding-doctor" />
                                        </div>
                                        <div className="position text-center">
                                            <div>Giáo sư, Bác sĩ Phạm Chí Lăng 5</div>
                                            <div>Cơ Xương Khớp,Chấn thương chỉnh hình</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="section-customize">
                                    <div className="customize-border">
                                        <div className="outer-bg">
                                            <div className="bg-image section-outstanding-doctor" />
                                        </div>
                                        <div className="position text-center">
                                            <div>Giáo sư, Bác sĩ Phạm Chí Lăng 6</div>
                                            <div>Cơ Xương Khớp,Chấn thương chỉnh hình</div>
                                        </div>
                                    </div>
                                </div>
                            </Slider>
                        </div>

                    </div>
                </div>
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

export default connect(mapStateToProps, mapDispatchToProps)(OutStandingDoctor);
