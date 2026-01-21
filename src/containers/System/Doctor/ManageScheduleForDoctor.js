import React, { Component } from 'react';
import { connect } from "react-redux";
import moment from 'moment';
import { LANGUAGES } from "../../../utils";
import { getScheduleDoctorByDate } from "../../../services/userService";
import DatePicker from '../../../components/Input/DatePicker';
import { toast } from "react-toastify";
import './ManageScheduleForDoctor.scss';

class ManageScheduleForDoctor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentDate: new Date(),
            schedules: []
        }
    }

    componentDidMount() {
        this.fetchDoctorSchedule();
    }

    fetchDoctorSchedule = async () => {
        let { userInfo } = this.props;
        let { currentDate } = this.state;

        if (!userInfo || !userInfo.id) return;

        let date = new Date(currentDate).getTime();

        let res = await getScheduleDoctorByDate(userInfo.id, date);

        if (res && res.errCode === 0) {
            this.setState({
                schedules: res.data || []
            });
        } else {
            toast.error("Không thể tải lịch khám");
        }
    }

    handleChangeDate = (date) => {
        this.setState(
            { currentDate: date[0] },
            async () => await this.fetchDoctorSchedule()
        );
    }

    render() {
        let { schedules, currentDate } = this.state;
        let { language } = this.props;

        return (
            <div className="manage-schedule-doctor-container">
                <h3 className="title">Lịch khám của tôi</h3>

                <div className="row mb-3">
                    <div className="col-4">
                        <label>Chọn ngày</label>
                        <DatePicker
                            className="form-control"
                            value={currentDate}
                            onChange={this.handleChangeDate}
                        />
                    </div>
                </div>

                <table className="table table-bordered table-hover">
                    <thead className="thead-dark">
                        <tr>
                            <th>STT</th>
                            <th className="text-center">Ngày khám</th>
                            <th className="text-center">Giờ khám</th>
                        </tr>
                    </thead>
                    <tbody>
                        {schedules && schedules.length > 0 ? (
                            schedules.map((item, index) => (
                                <tr key={item.id}>
                                    <td>{index + 1}</td>

                                    <td className="text-center schedule-date">
                                        {moment(Number(item.date)).format('DD/MM/YYYY')}
                                    </td>

                                    <td className="text-center schedule-time">
                                        {language === LANGUAGES.VI
                                            ? item.timeTypeData.valueVi
                                            : item.timeTypeData.valueEn}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" className="text-center">
                                    Chưa có lịch khám
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        language: state.app.language,
        userInfo: state.user.userInfo // doctor đang đăng nhập
    };
};

export default connect(mapStateToProps)(ManageScheduleForDoctor);
