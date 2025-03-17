const express = require('express')
const router = express.Router()

const {
    getAllJobs,
    getJob,
    createJob,
    updateJob,
    deleteJob
} = require('../controllers/jobs')

router.route('/').get(getAllJobs).post(createJob)
router.route('/:id').get(getJob).patch(updateJob).delete(deleteJob)

module.exports = router;

/*
    NOTES

    GENERAL NOTES

        Instead of adding the authentication middleware on every route here, we added it to the base URL ('/api/v1/jobs') in 
        app.js
*/