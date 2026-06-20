import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import * as actions from "../../../store/actions";
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import './ManageDoctor.scss';
import Select from 'react-select';
import { CRUD_ACTIONS, LANGUAGES } from "../../../utils";
import { getDetailInforDoctor } from '../../../services/userService';
import { toast } from 'react-toastify';

const mdParser = new MarkdownIt(/* Markdown-it options */);

class ManageDoctor extends Component {

    constructor(props) {
        super(props);
        this.state = {
            //save to markdown table
            contentHTML: '',
            contentMarkdown: '',
            selectedDoctor: '',
            description: '',
            hasOldData: false,
            listDoctors: [],

            //save to doctor_infor table
            listPrice: [],
            listProvince: [],
            listPayment: [],
            listSpecialty: [],
            listClinicName: [],
            listClinicAddress: [],

            selectedPrice: '',
            selectedProvince: '',
            selectedPayment: '',
            selectedSpecialty: [],
            selectedClinicName: '',
            selectedClinicAddress: '',

            note: ''
        }
    }

    componentDidMount() {
        this.props.fetchALLDoctors();
        this.props.getAllRequiredDoctorInfor();
    }

    buildDataInputSelect = (inputData, type) => {
        let result = [];
        let { language } = this.props;
        if (inputData && inputData.length > 0) {
            if (type === 'USERS') {
                inputData.map((item, index) => {
                    let object = {};
                    let labelVi = `${item.lastName} ${item.firstName}`;
                    let labelEn = `${item.firstName} ${item.lastName}`;
                    object.label = language === LANGUAGES.VI ? labelVi : labelEn;
                    object.value = item.id;
                    result.push(object)
                })
            }
            if (type === 'PRICE') {
                inputData.map((item, index) => {
                    let object = {};
                    let labelVi = `${item.valueVi} đ`;
                    let labelEn = `${item.valueEn} $`;
                    object.label = language === LANGUAGES.VI ? labelVi : labelEn;
                    object.value = item.keyMap;
                    result.push(object)
                })
            }

            if (type === 'PAYMENT') {
                inputData.map((item, index) => {
                    let object = {};
                    let labelVi = `${item.valueVi}`;
                    let labelEn = `${item.valueEn}`;
                    object.label = language === LANGUAGES.VI ? labelVi : labelEn;
                    object.value = item.keyMap;
                    result.push(object)
                })
            }

            if (type === 'PROVINCE') {
                inputData.map((item, index) => {
                    let object = {};
                    let labelVi = `${item.valueVi}`;
                    let labelEn = `${item.valueEn}`;
                    object.label = language === LANGUAGES.VI ? labelVi : labelEn;
                    object.value = item.keyMap;
                    result.push(object)
                })
            }

            if (type === 'SPECIALTY') {
                inputData.map((item, index) => {
                    let object = {};
                    object.label = item.name;
                    object.value = item.id;
                    result.push(object)
                })
            }

            if (type === 'CLINIC_NUMBER') {
                inputData.map((item, index) => {
                    let object = {};
                    let labelVi = `${item.valueVi}`;
                    let labelEn = `${item.valueEn}`;
                    object.label = language === LANGUAGES.VI ? labelVi : labelEn;
                    object.value = item.keyMap;
                    result.push(object)
                })
            }

            if (type === 'CLINIC_ADDRESS') {
                inputData.map((item, index) => {
                    let object = {};
                    let labelVi = `${item.valueVi}`;
                    let labelEn = `${item.valueEn}`;
                    object.label = language === LANGUAGES.VI ? labelVi : labelEn;
                    object.value = item.keyMap;
                    result.push(object)
                })
            }

        }

        return result;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        // Guard: only update if props actually changed (reference check)
        if (prevProps.allDoctors !== this.props.allDoctors) {
            let dataSelect = this.buildDataInputSelect(this.props.allDoctors, 'USERS');
            this.setState({ listDoctors: dataSelect });
        }

        if (prevProps.allRequiredDoctorInfor !== this.props.allRequiredDoctorInfor) {
            let { resPrice, resProvince, resPayment, resSpecialty, resClinicName, resClinicAddress } = this.props.allRequiredDoctorInfor;

            // Guard: only proceed if we have valid data
            if (!resPrice || !resProvince || !resPayment || !resSpecialty) return;

            this.setState({
                listPrice: this.buildDataInputSelect(resPrice, 'PRICE'),
                listProvince: this.buildDataInputSelect(resProvince, 'PROVINCE'),
                listPayment: this.buildDataInputSelect(resPayment, 'PAYMENT'),
                listSpecialty: this.buildDataInputSelect(resSpecialty, 'SPECIALTY'),
                listClinicName: this.buildDataInputSelect(resClinicName || [], 'CLINIC_NUMBER'),
                listClinicAddress: this.buildDataInputSelect(resClinicAddress || [], 'CLINIC_ADDRESS'),
            });
        }

        if (prevProps.language !== this.props.language) {
            // Guard: only proceed if required data is loaded
            if (!this.props.allRequiredDoctorInfor || !this.props.allDoctors) return;

            let { resPrice, resProvince, resPayment, resClinicName, resClinicAddress } = this.props.allRequiredDoctorInfor;

            this.setState({
                listDoctors: this.buildDataInputSelect(this.props.allDoctors, 'USERS'),
                listPrice: this.buildDataInputSelect(resPrice, 'PRICE'),
                listProvince: this.buildDataInputSelect(resProvince, 'PROVINCE'),
                listPayment: this.buildDataInputSelect(resPayment, 'PAYMENT'),
                listClinicName: this.buildDataInputSelect(resClinicName || [], 'CLINIC_NUMBER'),
                listClinicAddress: this.buildDataInputSelect(resClinicAddress || [], 'CLINIC_ADDRESS'),
            });
        }
    }

    // Finish!
    handleEditorChange = ({ html, text }) => {
        this.setState({
            contentHTML: html,
            contentMarkdown: text,
        })
        //console.log('handleEditorChange', html, text);
    }

    handleSaveContentMarkdown = () => {
        let { hasOldData } = this.state;

        if (!this.state.selectedDoctor || !this.state.selectedDoctor.value) {
            toast.error("Vui lòng chọn bác sĩ!");
            return;
        }
        if (!this.state.contentMarkdown || !this.state.contentHTML) {
            toast.error("Vui lòng nhập mô tả chi tiết / giới thiệu bác sĩ!");
            return;
        }
        if (!this.state.selectedPrice || !this.state.selectedPrice.value) {
            toast.error("Vui lòng chọn giá khám!");
            return;
        }
        if (!this.state.selectedPayment || !this.state.selectedPayment.value) {
            toast.error("Vui lòng chọn phương thức thanh toán!");
            return;
        }
        if (!this.state.selectedProvince || !this.state.selectedProvince.value) {
            toast.error("Vui lòng chọn tỉnh thành!");
            return;
        }
        if (!this.state.selectedClinicName) {
            toast.error("Vui lòng chọn phòng khám!");
            return;
        }
        if (!this.state.selectedClinicAddress) {
            toast.error("Vui lòng chọn địa chỉ phòng khám!");
            return;
        }
        if (!this.state.selectedSpecialty || this.state.selectedSpecialty.length === 0) {
            toast.error("Vui lòng chọn ít nhất một chuyên khoa!");
            return;
        }

        this.props.saveDetailDoctor({
            contentHTML: this.state.contentHTML,
            contentMarkdown: this.state.contentMarkdown,
            description: this.state.description || '',
            doctorId: this.state.selectedDoctor.value,
            action: hasOldData === true ? CRUD_ACTIONS.EDIT : CRUD_ACTIONS.CREATE,

            selectedPrice: this.state.selectedPrice.value,
            selectedProvince: this.state.selectedProvince.value,
            selectedPayment: this.state.selectedPayment.value,
            nameClinic: this.state.selectedClinicName ? this.state.selectedClinicName.label : '',
            addressClinic: this.state.selectedClinicAddress ? this.state.selectedClinicAddress.label : '',
            note: this.state.note || '',
            // Send array of specialtyIds for many-to-many
            specialtyIds: (this.state.selectedSpecialty || []).map(sp => sp.value),
            // Also keep legacy specialtyId = first selected for backward compat
            specialtyId: this.state.selectedSpecialty && this.state.selectedSpecialty.length > 0
                ? this.state.selectedSpecialty[0].value : '',
            clinicNameCode: this.state.selectedClinicName ? this.state.selectedClinicName.value : '',
            clinicAddressCode: this.state.selectedClinicAddress ? this.state.selectedClinicAddress.value : '',
        })
    }

    handleChangeSelect = async (selectedOption) => {
        this.setState({ selectedDoctor: selectedOption });
        let { listPrice, listProvince, listPayment, listSpecialty } = this.state;

        let res = await getDetailInforDoctor(selectedOption.value);
        if (res && res.errCode === 0 && res.data && res.data.MarkDown) {
            let markdown = res.data.MarkDown;

            let note = '', priceId = '', provinceId = '', paymentId = '',
                selectedPrice = '', selectedProvince = '', selectedPayment = '', selectedSpecialty = [],
                selectedClinicName = '', selectedClinicAddress = '',
                clinicNameCode = '', clinicAddressCode = '';

            let { listPrice, listProvince, listPayment, listClinicName, listClinicAddress } = this.state;

            if (res.data.Doctor_Infor) {
                note = res.data.Doctor_Infor.note;
                priceId = res.data.Doctor_Infor.priceId;
                provinceId = res.data.Doctor_Infor.provinceId;
                paymentId = res.data.Doctor_Infor.paymentId;
                clinicNameCode = res.data.Doctor_Infor.clinicNameCode;
                clinicAddressCode = res.data.Doctor_Infor.clinicAddressCode;

                let nameClinicText = res.data.Doctor_Infor.nameClinic;
                let addressClinicText = res.data.Doctor_Infor.addressClinic;

                selectedPrice = listPrice.find(item => item && item.value === priceId);
                selectedProvince = listProvince.find(item => item && item.value === provinceId);
                selectedPayment = listPayment.find(item => item && item.value === paymentId);

                // Load specialty as multi-select array from doctorSpecialties (M-N)
                if (res.data.doctorSpecialties && res.data.doctorSpecialties.length > 0) {
                    selectedSpecialty = res.data.doctorSpecialties
                        .map(ds => {
                            return this.state.listSpecialty.find(sp => sp && sp.value === ds.specialtyId);
                        })
                        .filter(Boolean);
                } else if (res.data.Doctor_Infor.specialtyId) {
                    // Fallback: legacy single specialty from doctor_infor
                    let found = this.state.listSpecialty.find(item =>
                        item && item.value === res.data.Doctor_Infor.specialtyId
                    );
                    if (found) selectedSpecialty = [found];
                }

                selectedClinicName = clinicNameCode
                    ? listClinicName.find(item => item && item.value === clinicNameCode)
                    : listClinicName.find(item => item && item.label === nameClinicText);

                selectedClinicAddress = clinicAddressCode
                    ? listClinicAddress.find(item => item && item.value === clinicAddressCode)
                    : listClinicAddress.find(item => item && item.label === addressClinicText);
            }

            this.setState({
                contentHTML: markdown.contentHTML,
                contentMarkdown: markdown.contentMarkdown,
                description: markdown.description,
                hasOldData: true,
                note: note,
                selectedPrice: selectedPrice,
                selectedProvince: selectedProvince,
                selectedPayment: selectedPayment || '',
                selectedSpecialty: selectedSpecialty,
                selectedClinicName: selectedClinicName || '',
                selectedClinicAddress: selectedClinicAddress || '',
            })

        } else {
            this.setState({
                contentHTML: '',
                contentMarkdown: '',
                description: '',
                hasOldData: false,
                note: '',
                selectedPrice: '',
                selectedProvince: '',
                selectedPayment: '',
                selectedSpecialty: [],
                selectedClinicName: '',
                selectedClinicAddress: '',
            })
        }
        //console.log(`Option selected:`, res)

    };

    handleChangeSelectDoctorInfor = async (selectedDoctor, name) => {
        let stateName = name.name;
        let stateCopy = { ...this.state };
        stateCopy[stateName] = selectedDoctor;

        this.setState({
            ...stateCopy
        })
    }

    handleOnChangeText = (event, id) => {
        let stateCopy = { ...this.state };
        stateCopy[id] = event.target.value;

        this.setState({
            ...stateCopy
        })
    }

    render() {
        let { hasOldData, listSpecialty } = this.state;
        let { language } = this.props;

        return (
            <div className="manage-doctor-container container-fluid">
                <div className="card shadow-sm border-0 rounded-3 mb-4">
                    <div className="card-body p-4">
                        {/* Header */}
                        <div className="row align-items-center mb-4">
                            <div className="col-md-6">
                                <h4 className="text-admin font-weight-bold mb-0">
                                    <i className="fa-solid fa-user-doctor me-2"></i>
                                    <FormattedMessage id="admin.manage-doctor.title" />
                                </h4>
                                <p className="text-secondary small mb-0 mt-1">
                                    {language === LANGUAGES.VI ? 'Thiết lập thông tin giới thiệu, giá khám, phòng khám và chuyên khoa của bác sĩ' : 'Configure introduction, prices, clinics and specialties for doctors'}
                                </p>
                            </div>
                        </div>

                        {/* Form Body */}
                        <div className="row g-3 border-top pt-4">
                            <div className='col-md-4 col-sm-6'>
                                <label className="form-label fw-bold small text-secondary mb-2"><FormattedMessage id="admin.manage-doctor.select-doctor" /></label>
                                <Select
                                    value={this.state.selectedDoctor}
                                    onChange={this.handleChangeSelect}
                                    options={this.state.listDoctors}
                                    placeholder={<FormattedMessage id="admin.manage-doctor.select-doctor" />}
                                    isClearable
                                />
                            </div>
                            <div className='col-md-8 col-sm-6'>
                                <label className="form-label fw-bold small text-secondary mb-2"><FormattedMessage id="admin.manage-doctor.information" /></label>
                                <textarea
                                    className='form-control'
                                    onChange={(event) => this.handleOnChangeText(event, 'description')}
                                    value={this.state.description}
                                    rows="1"
                                    style={{ minHeight: '38px', paddingTop: '6px' }}
                                >
                                </textarea>
                            </div>

                            <div className='col-md-4 col-sm-6'>
                                <label className="form-label fw-bold small text-secondary mb-2"><FormattedMessage id="admin.manage-doctor.price" /></label>
                                <Select
                                    value={this.state.selectedPrice}
                                    onChange={this.handleChangeSelectDoctorInfor}
                                    options={this.state.listPrice}
                                    placeholder={<FormattedMessage id="admin.manage-doctor.price" />}
                                    name="selectedPrice"
                                />
                            </div>
                            <div className='col-md-4 col-sm-6'>
                                <label className="form-label fw-bold small text-secondary mb-2"><FormattedMessage id="admin.manage-doctor.payment" /></label>
                                <Select
                                    value={this.state.selectedPayment}
                                    onChange={this.handleChangeSelectDoctorInfor}
                                    options={this.state.listPayment}
                                    placeholder={<FormattedMessage id="admin.manage-doctor.payment" />}
                                    name="selectedPayment"
                                />
                            </div>
                            <div className='col-md-4 col-sm-6'>
                                <label className="form-label fw-bold small text-secondary mb-2"><FormattedMessage id="admin.manage-doctor.province" /></label>
                                <Select
                                    value={this.state.selectedProvince}
                                    onChange={this.handleChangeSelectDoctorInfor}
                                    options={this.state.listProvince}
                                    placeholder={<FormattedMessage id="admin.manage-doctor.province" />}
                                    name="selectedProvince"
                                />
                            </div>

                            <div className='col-md-6 col-sm-6'>
                                <label className="form-label fw-bold small text-secondary mb-2"><FormattedMessage id="admin.manage-doctor.nameClinic" /></label>
                                <Select
                                    value={this.state.selectedClinicName}
                                    onChange={this.handleChangeSelectDoctorInfor}
                                    options={this.state.listClinicName}
                                    placeholder={<FormattedMessage id="admin.manage-doctor.nameClinic" />}
                                    name="selectedClinicName"
                                    isClearable
                                />
                            </div>
                            <div className='col-md-6 col-sm-6'>
                                <label className="form-label fw-bold small text-secondary mb-2"><FormattedMessage id="admin.manage-doctor.addressClinic" /></label>
                                <Select
                                    value={this.state.selectedClinicAddress}
                                    onChange={this.handleChangeSelectDoctorInfor}
                                    options={this.state.listClinicAddress}
                                    placeholder={<FormattedMessage id="admin.manage-doctor.addressClinic" />}
                                    name="selectedClinicAddress"
                                    isClearable
                                />
                            </div>

                            <div className='col-12'>
                                <label className="form-label fw-bold small text-secondary mb-2">
                                    <FormattedMessage id="admin.manage-doctor.select-specialty" />
                                    <span className="text-muted ms-2 fw-normal small">
                                        (Có thể chọn nhiều chuyên khoa)
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

                            <div className='col-12'>
                                <label className="form-label fw-bold small text-secondary mb-2"><FormattedMessage id="admin.manage-doctor.note" /></label>
                                <input className='form-control'
                                    onChange={(event) => this.handleOnChangeText(event, 'note')}
                                    value={this.state.note}
                                  />
                            </div>

                            <div className='col-12 mt-4'>
                                <label className="form-label fw-bold small text-secondary mb-2">Bài viết giới thiệu chi tiết</label>
                                <div className="border rounded-3 overflow-hidden">
                                    <MdEditor
                                        style={{ height: '300px' }}
                                        renderHTML={text => mdParser.render(text)}
                                        onChange={this.handleEditorChange}
                                        value={this.state.contentMarkdown}
                                    />
                                </div>
                            </div>

                            <div className='col-12 mt-4'>
                                <button
                                    onClick={() => this.handleSaveContentMarkdown()}
                                    className={`btn btn-sm rounded-pill px-4 ${
                                        hasOldData === true ? 'btn-warning text-white' : 'btn-admin'
                                    }`}>
                                    {hasOldData === true ?
                                        <FormattedMessage id="admin.manage-doctor.save" />
                                        :
                                        <FormattedMessage id="admin.manage-doctor.create" />
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

}

const mapStateToProps = state => {
    return {
        allDoctors: state.admin.allDoctors,
        language: state.app.language,
        allRequiredDoctorInfor: state.admin.allRequiredDoctorInfor
    };
};

const mapDispatchToProps = dispatch => {
    return {
        fetchALLDoctors: () => dispatch(actions.fetchALLDoctors()),
        saveDetailDoctor: (data) => dispatch(actions.saveDetailDoctor(data)),
        getAllRequiredDoctorInfor: () => dispatch(actions.getAllRequiredDoctorInfor()),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(ManageDoctor);
