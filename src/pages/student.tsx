import TCs from '@/components/TCs'
import { calculateTimer, checkMinMax, onlyInt } from '@/utils/functions'
import { FormEvent, ReactElement, useState } from 'react'
import { indexedDBStorage } from '@/utils/storage'
import Loader from '@/components/Loader'

export default function Student() {

    const classroomCodeProps = {
        min: 0,
        max: 999999
    }

    const [classroomCode, setClassroomCode] = useState(-1)
    const [name, setName] = useState('')
    const [loaderVisibility, setLoaderVisibility] = useState(false)
    const [messageContent, setMessageContent] = useState('')
    const [timer, setTimer] = useState('')
    const [oldCodeInterval, setOldCodeInterval] = useState<NodeJS.Timeout | number>(0)

    async function handleForm(event: FormEvent): Promise<void> {
        event.preventDefault()

        if(await indexedDBStorage.load(classroomCode))
            return setMessageContent(`You already submitted an attendance for this code.`)

        setLoaderVisibility(true)

        const url = `api/process_attendance?code=${classroomCode}&name=${name}`
        const result = await fetch(url, {
            method: 'POST'
        })

        if(!result.ok && result.status !== 403) {
            setLoaderVisibility(false)
            return alert(`There have been an issue while submitting your attendance. Error code : ${result.status}. Message : ${await result.text()}`)
        }

        const data = await result.json()

        if(data.empty) {
            setMessageContent(`The room does not exist.`)
            setLoaderVisibility(false)
            return
        }

        if(data.denied) {
            setLoaderVisibility(false)
            if(Date.now() > data.js_expiry)
                return setMessageContent(`You have no time left to confirm your attendance.`)
            else
                return setMessageContent(`You have already sent a submission for this code.`)
        }

        setMessageContent(`Thanks ${name}, you have been registered successfully.`)
        await indexedDBStorage.save(classroomCode, true)

        setLoaderVisibility(false)

        if(oldCodeInterval)
            clearInterval(oldCodeInterval)

        setOldCodeInterval(
            setInterval(() => {
                setTimer(calculateTimer(data.js_expiry))
            }, 1000)
        )
    }

    return (
        <main>
            <h1 className="no-margin-bottom">Prove your attendance</h1>
            <h2>Please enter the code you received below :</h2>
            <form className="student-form" onSubmit={handleForm} >
                <input
                    type="text"
                    placeholder="Your name"
                    id="name-input"
                    maxLength={50}
                    required
                    onChange={(event) => setName(event.target.value)}
                />
                <input
                    type="number"
                    placeholder="_  _  _  _  _  _"
                    id="code-input"
                    min={classroomCodeProps.min}
                    max={classroomCodeProps.max}
                    value={classroomCode >= 0 ? classroomCode : ''}
                    onKeyPress={(event) => onlyInt(event as any)}
                    onKeyUp={(event) => checkMinMax((event.target as any).value, classroomCodeProps.min, classroomCodeProps.max, setClassroomCode)}
                    onChange={(event) => setClassroomCode(parseInt(event.target.value))}
                    required
                />
                <button
                    type="submit"
                    id="code-submit"
                    className="submit-btn"
                >
                    Submit
                </button>
            </form>
            <h2 id="message-box">{messageContent}</h2>
            <h2 id="timer">{timer}</h2>
            <Loader visible={loaderVisibility} />
            <TCs color='grey' />
        </main>
    )
}