const Job = require('../models/Job')
const StatusCodes = require('http-status-codes')
const { BadRequestError, NotFoundError } = require('../errors')

const getAllJobs = async (req, res) => {
    const jobs = await Job.find({ createdBy: req.user.userId }).sort('createdAt')
    res.status(StatusCodes.OK).json({ jobs, numOfJobs: jobs.length })
}

// Version 1 of getJob
/*
const getJob = async (req, res) => {
    const job = await Job.findOne({ _id: req.params.id, createdBy: req.user.userId })
    res.status(StatusCodes.OK).json({ job })
}
*/

// Version 2 of getJob
const getJob = async (req, res) => {
    const {params:{id:jobId}, user: {userId}} = req // Note 1
    const job = await Job.findOne({ _id: jobId, createdBy: userId })
    if (!job) {
        throw new NotFoundError(`No job with id ${jobId} was found`)
    }
    res.status(StatusCodes.OK).json({ job })
}

const createJob = async (req, res) => {
    req.body.createdBy = req.user.userId
    const job = await Job.create(req.body)
    res.status(StatusCodes.OK).json({ job })
}

const updateJob = async (req, res) => {
    const {
        body: newData,
        params: {id:jobId},
        user: {userId}
    } = req
    const updatedJob = await Job.findOneAndUpdate({_id: jobId, createdBy: userId}, newData, {
        runValidators: true,
        new: true
    })
    if (!updatedJob) {
        throw new NotFoundError(`No job with id ${jobId} was found`)
    }
    res.status(StatusCodes.OK).json({ updatedJob })
}

const deleteJob = async (req, res) => {
    const {params: {id:jobId}, user: {userId}} = req
    const deletedJob = await Job.findOneAndDelete({_id: jobId, createdBy: userId})
    if (!deletedJob) {
        throw new NotFoundError(`No job with id ${jobId} was found`)
    }
    res.status(StatusCodes.OK).send()
}

module.exports = {
    getAllJobs,
    getJob,
    createJob,
    updateJob,
    deleteJob
}

/*
    NOTES

    Note 1
        
        This is nested destructuring. Here's a breakdown of what's happening:

            Step 1 (extract params and user):
                const {params, user} = req // Note 1
            
            Step 2 (extract id from params and userId from user):
                const {params:{id}, user: {userId}}
            
            Step 3 (give an alias to req.params.id called jobId so it becomes clearer which id we are referring to)
                onst {params:{id: jobId}, user: {userId}}
*/
