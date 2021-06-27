const axios = require('axios')
const utils = require('./utils/utils')
const readFile = utils.readFile
const writeFile = utils.writeFile
const convertJSONToObject = utils.convertJSONToObject
const convertObjectToJSON = utils.convertObjectToJSON
const sleep = utils.sleep

module.exports = class {
    #access_token
    #client_id
    #client_secret

    constructor(client_id, client_secret) {
        this.#access_token = undefined
        this.#client_id = client_id
        this.#client_secret = client_secret
    }

    async updateInfoProjectAndStudents(name_project) {
        console.log('start updateInfoProjectAndStudents')
        await this.updateMoscowStudents()
        await sleep(10)
        await this.updateKazanStudents()
        await sleep(10)
        await this.updateIdProject(name_project)
        await sleep(10)
        await this.updateInfoProject(name_project)
        console.log('end updateInfoProjectAndStudents')
    }

    async updateMoscowStudents() {
        await this.#login()
        console.log('start updateMoscowStudents')
        const id_campus_moscow = '17'
        const path_file = './../database/students/moscow_students.txt'
        const students = await this.#getCampusStudents(id_campus_moscow)
        const json_students = convertObjectToJSON(students)
        writeFile(path_file, json_students)
        console.log('end updateMoscowStudents')
    }

    async updateKazanStudents() {
        await this.#login()
        console.log('start updateKazanStudents')
        const id_campus_kazan = '23'
        const path_file = './../database/students/kazan_students.txt'
        const students = await this.#getCampusStudents(id_campus_kazan)
        const json_students = convertObjectToJSON(students)
        writeFile(path_file, json_students)
        console.log('end updateKazanStudents')
    }

    async updateIdProject(name_project) {
        await this.#login()
        console.log('start updateIdProject')
        const path_file = './../database/ids_projects/ids_projects.txt'
        let json_text = readFile(path_file)
        const projects = convertJSONToObject(json_text) || []
        const id_project = await this.#getIdProject(name_project)
        if (id_project == undefined) {
            return
        }
        const object_project = {
            id: id_project,
            name: name_project
        }
        for (let i = 0; i < projects.length; i++) {
            if (projects[i].id === object_project.id) {
                return 
            }
        }
        projects.push(object_project)
        json_text = convertObjectToJSON(projects)
        writeFile(path_file, json_text)
        console.log('end updateIdProject')
    }

    async updateInfoProject(name_project) {
        await this.#login()
        console.log('start updateInfoProject')
        const json_ids_projects = readFile('./../database/ids_projects/ids_projects.txt')
        const object_ids_projects = convertJSONToObject(json_ids_projects)
        let id_project = undefined
        for (let i = 0; i < object_ids_projects.length; i++) {
            if (object_ids_projects[i].name == name_project) {
                id_project = object_ids_projects[i].id
            }
        }
        if (id_project == undefined) {
            console.log(name_project)
            const id_project = await this.#getIdProject(name_project)
            if (id_project == undefined) {
                return 
            }
            await sleep(5)
            this.updateIdProject(name_project)
        }
        console.log('_______')
        const projects = await this.#getPeopleConnectedWithTheProject(id_project)
        const moscow_students = this.#getMoscowStudents()
        const kazan_students = this.#getKazanStudents()
        let moscow_students_in_project = projects.filter(value => {
            return moscow_students.indexOf(value.login) != -1
        })
        let kazan_students_in_project = projects.filter(value => {
            return kazan_students.indexOf(value.login) != -1
        })
        moscow_students_in_project = moscow_students_in_project.map(value => {
            return {
                login: value.login,
                status: value.status
            }
        })
        kazan_students_in_project = kazan_students_in_project.map(value => {
            return {
                login: value.login,
                status: value.status
            }
        })
        const json_moscow_students_in_project = convertObjectToJSON(moscow_students_in_project)
        const json_kazan_students_in_project = convertObjectToJSON(kazan_students_in_project)
        writeFile('./../database/projects_moscow/' + name_project + '.txt', json_moscow_students_in_project)
        writeFile('./../database/projects_kazan/' + name_project + '.txt', json_kazan_students_in_project)
        console.log('end updateInfoProject')
    }

    async #login() {
        if (this.#access_token != undefined) {
            return 
        }
        const data = (await axios({
            method: "POST",
            url: 'https://api.intra.42.fr/oauth/token',
            params: {
                grant_type: 'client_credentials',
                client_id: this.#client_id,
                client_secret: this.#client_secret
            }
        }))['data']
        if (data['access_token'] == undefined) {
            throw 'Error login!'
        }
        this.#access_token = data['access_token']
    }

    async #getIdProject(name_project) {
        const data = (await axios({
            method: "GET",
            url: 'https://api.intra.42.fr/v2/projects',
            headers: {
                'Authorization': 'Bearer ' + this.#access_token
            },
            params: {
                'filter[name]': name_project
            }
        }))['data']
        if (data[0] == undefined) {
            return undefined
        }
        return data[0]['id'].toString()
    }

    async #getCampusStudents(id_campus) {
        const url = 'https://api.intra.42.fr/v2/campus/' + id_campus + '/users'
        const filter = value => {
            return value?.login
        }
        return await this.#readAllRequestPages(url, filter)
    }

    #getMoscowStudents() {
        const path_file = './../database/students/moscow_students.txt'
        const students_json = readFile(path_file)
        const students_object = convertJSONToObject(students_json)
        return students_object
    }

    #getKazanStudents() {
        const path_file = './../database/students/kazan_students.txt'
        const students_json = readFile(path_file)
        const students_object = convertJSONToObject(students_json)
        return students_object
    }

    async #getPeopleConnectedWithTheProject(id_project) {
        const url = 'https://api.intra.42.fr/v2/projects/' + id_project + '/projects_users'
        const filter = value => {
            return {
                login: value.user.login,
                final_mark: value.final_mark,
                status: value.status,
                'validated?': value['validated?'],
                occurrence: value.occurrence
            }
        }
        return await this.#readAllRequestPages(url, filter)
    }

    async #readAllRequestPages(url, filter) {
        let page = 0;
        let data_one_page = []
        let all_data = []
        while (true) {
            data_one_page = (await axios({
                method: "GET",
                url: url,
                headers: {
                    'Authorization': 'Bearer ' + this.#access_token
                },
                params: {
                    per_page: '1000',
                    page: page.toString()
                }
            }))['data']
            if (data_one_page.length == 0) {
                break
            }
            if (filter == undefined) {
                all_data = all_data.concat(data_one_page)
            } else {
                all_data = all_data.concat(data_one_page.map(filter))
            }
            await sleep(10)
            page++
        }
        return (all_data)
    }
}
