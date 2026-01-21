export const adminMenu = [
    { //quản lý user
        name: 'menu.admin.manage-user',
        menus: [
            {
                name: 'menu.admin.crud', link: '/system/user-manage'
            },

            {
                name: 'menu.admin.crud-redux', link: '/system/user-redux'
            },

            {
                name: 'menu.admin.manage-doctor', link: '/system/manage-doctor'
                // subMenus: [
                //     { name: 'menu.system.system-administrator.user-manage', link: '/system/user-manage' },
                //     { name: 'menu.system.system-administrator.user-redux', link: '/system/user-redux' },

                // ]
            },

            // {
            //     name: 'menu.admin.manage-admin', link: '/system/user-admin'
            // },

            { //Quản lý đặt lịch khám bệnh 
                name: 'menu.admin.manage-schedule', link: '/system/manage-schedule'
            },
        ]
    },

    { //quản lý phòng khám
        name: 'menu.admin.clinic',
        menus: [
            {
                name: 'menu.admin.manage-clinic', link: '/system/manage-clinic'
            },
        ]
    },

    { //quản lý chuyên khoa
        name: 'menu.admin.specialty',
        menus: [
            {
                name: 'menu.admin.manage-specialty', link: '/system/manage-specialty'
            },
        ]
    },

    { //quản lý cẩm nang
        name: 'menu.admin.handbook',
        menus: [
            {
                name: 'menu.admin.manage-handbook', link: '/system/manage-handbook'
            },
        ]
    },
];

export const doctorMenu = [
    {
        name: 'menu.admin.manage-user',
        menus: [
            { //Quản lý kế hoạch khám bệnh của doctor
                name: 'menu.doctor.manage-schedule-doctor', link: '/doctor/manage-schedule-doctor'
            },

            { //Quản lý lịch hẹn khám bệnh của doctor
                name: 'menu.doctor.manage-patient', link: '/doctor/manage-patient'
            },
        ]
    }
];