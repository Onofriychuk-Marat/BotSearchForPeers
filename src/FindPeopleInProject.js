const utils = require('./utils/utils')
const readFile = utils.readFile
const convertJSONToObject = utils.convertJSONToObject

module.exports.FindPeopleInProject = class {
    #name_project
    #students_kazan
    #students_moscow

    constructor(name_project) {
        this.#name_project = name_project
    }

    start() {
        const json_studets_kazan = readFile('./../database/projects_kazan/' + this.#name_project + '.txt')
        const json_studets_moscow = readFile('./../database/projects_moscow/' + this.#name_project + '.txt')
        this.#students_kazan = convertJSONToObject(json_studets_kazan) || []
        this.#students_moscow = convertJSONToObject(json_studets_moscow) || []
    }

    getNameProject() {
        return this.#name_project
    }

    getCountMoscowStudents() {

        return this.#students_moscow.length
    }

    getCountKazanStudents() {
        return this.#students_kazan.length
    }

    getStatusesMoscowStudents() {
        return this.#getStatuseStudents(this.#students_moscow)
    }

    getStatusesKazanStudents() {
        return this.#getStatuseStudents(this.#students_kazan)
    }

    getNamesMoscowStudentsByStatus(status) {
        return this.#getNamesStudentsByStatus(this.#students_moscow, status)
    }

    getNamesKazanStudentsByStatus(status) {
        return this.#getNamesStudentsByStatus(this.#students_kazan, status)
    }

    #getStatuseStudents(students) {
        let mapStatuses = new Map()

        for (let student of students) {
            let value = mapStatuses.get(student.status)
            if (value == undefined) {
                mapStatuses.set(student.status, 0)
            } else {
                mapStatuses.set(student.status, ++value)
            }
        }
        return (mapStatuses)
    }

    #getNamesStudentsByStatus(students, status) {
        const studetsByStatus = students.filter(value => {
            if (status == value.status) {
                return true
            }
            return false
        })
        const nameStudentsByStatus = studetsByStatus.map(value => {
            return value.login
        })
        return nameStudentsByStatus
    }
}
