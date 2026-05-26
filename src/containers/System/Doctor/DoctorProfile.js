import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import * as actions from "../../../store/actions";
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import Select from 'react-select';
import { CRUD_ACTIONS, LANGUAGES } from "../../../utils";
import { getDetailInforDoctor } from '../../../services/userService';
import './DoctorProfile.scss';

const mdParser = new MarkdownIt(/* Markdown-it options */);

class DoctorProfile extends Component {
    constructor(props) {
        super(props);
        this.state = {
            // save to markdown table
            contentHTML: '',
            contentMarkdown: '',
            description: '',
            hasOldData: false,

            // save to doctor_infor table
            listPrice: [],
            listProvince: [],
            listSpecialty: [],

            selectedPrice: '',
            selectedProvince: '',
            selectedSpecialty: [],

            nameClinic: '',
            addressClinic: '',
            note: ''
        }
    }

    componentDidMount() {
        this.props.getAllRequiredDoctorInfor();
        this.fetchDoctorInfo();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.allRequiredDoctorInfor !== this.props.allRequiredDoctorInfor) {
            let { resPrice, resProvince, resSpecialty } = this.props.allRequiredDoctorInfor;

            let dataSelectPrice = this.buildDataInputSelect(resPrice, 'PRICE');
            let dataSelectProvince = this.buildDataInputSelect(resProvince, 'PROVINCE');
            let dataSelectSpecialty = this.buildDataInputSelect(resSpecialty, 'SPECIALTY');

            this.setState({
                listPrice: dataSelectPrice,
                listProvince: dataSelectProvince,
                listSpecialty: dataSelectSpecialty
            }, () => {
                // Ensure dropdowns are correctly set if data arrived late
                this.updateSelectedOptions();
            });
        }

        if (prevProps.language !== this.props.language) {
            let { resPrice, resProvince } = this.props.allRequiredDoctorInfor;
            let dataSelectPrice = this.buildDataInputSelect(resPrice, 'PRICE');
            let dataSelectProvince = this.buildDataInputSelect(resProvince, 'PROVINCE');

            this.setState({
                listPrice: dataSelectPrice,
                listProvince: dataSelectProvince
            }, () => {
                this.updateSelectedOptions();
            });
        }
    }

    buildDataInputSelect = (inputData, type) => {
        let result = [];
        let { language } = this.props;
        if (inputData && inputData.length > 0) {
            if (type === 'PRICE') {
                inputData.map(item => {
                    let object = {};
                    let labelVi = `${item.valueVi} đ`;
                    let labelEn = `${item.valueEn} $`;
                    object.label = language === LANGUAGES.VI ? labelVi : labelEn;
                    object.value = item.keyMap;
                    result.push(object)
                })
            }
            if (type === 'PROVINCE') {
                inputData.map(item => {
                    let object = {};
                    let labelVi = `${item.valueVi}`;
                    let labelEn = `${item.valueEn}`;
                    object.label = language === LANGUAGES.VI ? labelVi : labelEn;
                    object.value = item.keyMap;
                    result.push(object)
                })
            }
            if (type === 'SPECIALTY') {
                inputData.map(item => {
                    let object = {};
                    object.label = item.name;
                    object.value = item.id;
                    result.push(object)
                })
            }
        }
        return result;
    }

    fetchDoctorInfo = async () => {
        let { user } = this.props;
        if (!user || !user.id) return;

        let res = await getDetailInforDoctor(user.id);
        if (res && res.errCode === 0 && res.data && res.data.MarkDown) {
            let markdown = res.data.MarkDown;
            let info = res.data.Doctor_Infor;

            this.setState({
                contentHTML: markdown.contentHTML,
                contentMarkdown: markdown.contentMarkdown,
                description: markdown.description,
                hasOldData: true,
                addressClinic: info ? info.addressClinic : '',
                nameClinic: info ? info.nameClinic : '',
                note: info ? info.note : '',
                savedPriceId: info ? info.priceId : '',
                savedProvinceId: info ? info.provinceId : '',
                // Store raw doctorSpecialties for multi-select
                savedDoctorSpecialties: res.data.doctorSpecialties || [],
                // Fallback single specialtyId from Doctor_Infor
                savedSpecialtyId: info ? info.specialtyId : ''
            }, () => {
                this.updateSelectedOptions();
            });
        }
    }

    updateSelectedOptions = () => {
        let { listPrice, listProvince, listSpecialty,
              savedPriceId, savedProvinceId, savedSpecialtyId, savedDoctorSpecialties } = this.state;

        if (listPrice && listPrice.length > 0 && savedPriceId) {
            this.setState({ selectedPrice: listPrice.find(item => item.value === savedPriceId) });
        }
        if (listProvince && listProvince.length > 0 && savedProvinceId) {
            this.setState({ selectedProvince: listProvince.find(item => item.value === savedProvinceId) });
        }
        if (listSpecialty && listSpecialty.length > 0) {
            // Prefer M-N data from doctorSpecialties[]
            if (savedDoctorSpecialties && savedDoctorSpecialties.length > 0) {
                let selected = savedDoctorSpecialties
                    .map(ds => listSpecialty.find(sp => sp.value === ds.specialtyId))
                    .filter(Boolean);
                this.setState({ selectedSpecialty: selected });
            } else if (savedSpecialtyId) {
                // Fallback: single specialty from Doctor_Infor
                let found = listSpecialty.find(item => item.value === savedSpecialtyId);
                if (found) this.setState({ selectedSpecialty: [found] });
            }
        }
    }

    handleEditorChange = ({ html, text }) => {
        this.setState({
            contentHTML: html,
            contentMarkdown: text,
        });
    }

    handleChangeSelectDoctorInfor = async (selectedOption, name) => {
        let stateName = name.name;
        let stateCopy = { ...this.state };
        stateCopy[stateName] = selectedOption;
        this.setState({ ...stateCopy });
    }

    handleOnChangeText = (event, id) => {
        let stateCopy = { ...this.state };
        stateCopy[id] = event.target.value;
        this.setState({ ...stateCopy });
    }

    handleSaveProfile = () => {
        let { hasOldData, selectedPrice, selectedProvince, selectedSpecialty } = this.state;
        let { user } = this.props;

        this.props.saveDetailDoctor({
            contentHTML: this.state.contentHTML,
            contentMarkdown: this.state.contentMarkdown,
            description: this.state.description,
            doctorId: user.id,
            action: hasOldData === true ? CRUD_ACTIONS.EDIT : CRUD_ACTIONS.CREATE,

            selectedPrice: selectedPrice && selectedPrice.value ? selectedPrice.value : '',
            selectedProvince: selectedProvince && selectedProvince.value ? selectedProvince.value : '',
            nameClinic: this.state.nameClinic,
            addressClinic: this.state.addressClinic,
            note: this.state.note,
            // Many-to-many: send array
            specialtyIds: (selectedSpecialty || []).map(sp => sp.value),
            specialtyId: selectedSpecialty && selectedSpecialty.length > 0
                ? selectedSpecialty[0].value : ''
        });
    }

    render() {
        let { language } = this.props;
        let { hasOldData } = this.state;
        
        return (
            <div className="doctor-profile-container">
                <div className="profile-header">
                    <h2><i className="far fa-id-badge"></i> {language === LANGUAGES.VI ? 'Cập Nhật Hồ Sơ Bác Sĩ' : 'Update Doctor Profile'}</h2>
                    <p>{language === LANGUAGES.VI ? 'Cập nhật thông tin chi tiết để bệnh nhân hiểu rõ hơn về bạn.' : 'Update your details so patients can understand you better.'}</p>
                </div>

                <div className="profile-card">
                    <div className="card-section">
                        <h3 className="section-title"><i className="fas fa-info-circle"></i> {language === LANGUAGES.VI ? 'Thông tin cơ bản' : 'Basic Information'}</h3>
                        <div className="form-group full-width">
                            <label>{language === LANGUAGES.VI ? 'Mô tả ngắn gọn' : 'Short Description'}</label>
                            <textarea
                                className="form-control"
                                rows="3"
                                onChange={(event) => this.handleOnChangeText(event, 'description')}
                                value={this.state.description}
                                placeholder={language === LANGUAGES.VI ? 'Giới thiệu ngắn về bản thân...' : 'Briefly introduce yourself...'}
                            ></textarea>
                        </div>
                    </div>

                    <div className="card-section">
                        <h3 className="section-title"><i className="fas fa-hospital"></i> {language === LANGUAGES.VI ? 'Thông tin phòng khám' : 'Clinic Information'}</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label><FormattedMessage id="admin.manage-doctor.price" /></label>
                                <Select
                                    value={this.state.selectedPrice}
                                    onChange={this.handleChangeSelectDoctorInfor}
                                    options={this.state.listPrice}
                                    placeholder={<FormattedMessage id="admin.manage-doctor.price" />}
                                    name="selectedPrice"
                                />
                            </div>
                            <div className="form-group">
                                <label><FormattedMessage id="admin.manage-doctor.province" /></label>
                                <Select
                                    value={this.state.selectedProvince}
                                    onChange={this.handleChangeSelectDoctorInfor}
                                    options={this.state.listProvince}
                                    placeholder={<FormattedMessage id="admin.manage-doctor.province" />}
                                    name="selectedProvince"
                                />
                            </div>
                            <div className="form-group">
                                <label>
                                    <FormattedMessage id="admin.manage-doctor.select-specialty" />
                                    <span style={{ color: '#006ea8', marginLeft: 8, fontSize: 12 }}>
                                        ({language === LANGUAGES.VI ? 'Chọn được nhiều' : 'Multiple allowed'})
                                    </span>
                                </label>
                                <Select
                                    isMulti
                                    value={this.state.selectedSpecialty}
                                    onChange={(selectedOptions) => {
                                        this.setState({ selectedSpecialty: selectedOptions || [] });
                                    }}
                                    options={this.state.listSpecialty}
                                    placeholder={<FormattedMessage id="admin.manage-doctor.select-specialty" />}
                                    name="selectedSpecialty"
                                    closeMenuOnSelect={false}
                                />
                            </div>
                            <div className="form-group">
                                <label><FormattedMessage id="admin.manage-doctor.nameClinic" /></label>
                                <input className="form-control"
                                    onChange={(event) => this.handleOnChangeText(event, 'nameClinic')}
                                    value={this.state.nameClinic}
                                    placeholder={language === LANGUAGES.VI ? 'Tên phòng khám' : 'Clinic Name'}
                                />
                            </div>
                            <div className="form-group full-width">
                                <label><FormattedMessage id="admin.manage-doctor.addressClinic" /></label>
                                <input className="form-control"
                                    onChange={(event) => this.handleOnChangeText(event, 'addressClinic')}
                                    value={this.state.addressClinic}
                                    placeholder={language === LANGUAGES.VI ? 'Địa chỉ chi tiết' : 'Detailed Address'}
                                />
                            </div>
                            <div className="form-group full-width">
                                <label><FormattedMessage id="admin.manage-doctor.note" /></label>
                                <input className="form-control"
                                    onChange={(event) => this.handleOnChangeText(event, 'note')}
                                    value={this.state.note}
                                    placeholder={language === LANGUAGES.VI ? 'Ghi chú cho bệnh nhân' : 'Notes for patients'}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="card-section markdown-section">
                        <h3 className="section-title"><i className="fas fa-file-alt"></i> {language === LANGUAGES.VI ? 'Bài viết giới thiệu chi tiết' : 'Detailed Article'}</h3>
                        <div className="markdown-editor-wrapper">
                            <MdEditor
                                style={{ height: '400px' }}
                                renderHTML={text => mdParser.render(text)}
                                onChange={this.handleEditorChange}
                                value={this.state.contentMarkdown}
                            />
                        </div>
                    </div>

                    <div className="profile-actions">
                        <button
                            onClick={() => this.handleSaveProfile()}
                            className="btn-save-profile"
                        >
                            <i className="fas fa-save"></i>
                            {this.state.hasOldData === true ?
                                (language === LANGUAGES.VI ? ' Lưu Thay Đổi' : ' Save Changes')
                                :
                                (language === LANGUAGES.VI ? ' Tạo Hồ Sơ' : ' Create Profile')
                            }
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        language: state.app.language,
        user: state.user.userInfo,
        allRequiredDoctorInfor: state.admin.allRequiredDoctorInfor
    };
};

const mapDispatchToProps = dispatch => {
    return {
        saveDetailDoctor: (data) => dispatch(actions.saveDetailDoctor(data)),
        getAllRequiredDoctorInfor: () => dispatch(actions.getAllRequiredDoctorInfor()),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(DoctorProfile);
