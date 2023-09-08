import React, { useEffect, useState, useCallback } from "react"
import Select from "react-select"
import { nanoid } from "nanoid"
import { getLinkPreview } from "link-preview-js"
// import { MdDeleteForever } from "react-icons/md"

import { useDispatch, useSelector } from "react-redux"
import {
	addBookmark,
	addGroup,
	deleteBookmark,
	deleteGroup,
	editBookmark,
	editGroupTitle,
} from "../redux/features/bookmarkSlice"

import { iconPlaceHolder } from "../utils/constants"
import { resetFrom, setFormGroup } from "../redux/features/formSlice"

export default function BookmarkForm() {
	const bookmarks = useSelector((state: StoreRootState) => state.bookmarks)
	const { visible, group, prevBookmark, mode } = useSelector((state: StoreRootState) => state.form)

	const [groupTitle, setGroupTitle] = useState("")
	const [title, setTitle] = useState("")
	const [url, setUrl] = useState("")

	const [loading, setLoading] = useState(false)

	const dispatch = useDispatch()

	useEffect(() => {
		if (mode === "addBookmark") {
			setGroupTitle("")
			setTitle("")
			setUrl("")
		} else if (mode === "addGroup") {
			setGroupTitle("")
		} else if (mode === "editBookmark") {
			setTitle(prevBookmark?.title || "")
			setUrl(prevBookmark?.url || "")
		} else if (mode === "editGroup" && group?.title) {
			setGroupTitle(group.title)
		}

		return () => {
			setGroupTitle("")
			setTitle("")
			setUrl("")
		}
	}, [prevBookmark, mode, group])

	const handleGroupGroupNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setGroupTitle(e.target.value)
	}

	const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setTitle(e.target.value)
	}

	const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUrl(e.target.value)
	}

	const handleGroupChange = (option: any) => {
		dispatch(setFormGroup({ id: option.value, title: option.label }))
	}

	const fetchFavicon = async (url: string): Promise<string> => {
		let favicon = require("../assets/placeholder-favicon.png")

		if (!url.startsWith("http") || !url.startsWith("https")) return favicon

		try {
			await getLinkPreview(url, {
				headers: {
					"user-agent": "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
					"Access-Control-Allow-Origin": "*",
				},
				proxyUrl: "https://cors-anywhere.herokuapp.com/",
				imagesPropertyType: "og",
				followRedirects: "follow",
				timeout: 10000,
			}).then((data) => {
				if (data.favicons.length > 1) {
					favicon = data.favicons[-1]
				} else {
					favicon = data.favicons[0]
				}
			})
		} catch (error) {
			console.log(error)
		}

		return favicon
	}

	const handleGroupSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault()
		dispatch(addGroup({ id: nanoid(), title: groupTitle, bookmarks: [] }))
		quitFrom()
	}
	const handleGroupEdit = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault()
		dispatch(editGroupTitle({ id: group?.id ?? "default", title: groupTitle }))
		quitFrom()
	}
	const handleGroupDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault()
		if (group?.id) dispatch(deleteGroup(group?.id))
		quitFrom()
	}

	const handleBookmarkEdit = async (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault()
		setLoading(true)

		let bookmark: Bookmark = {
			id: prevBookmark?.id || nanoid(),
			favicon: prevBookmark?.favicon || iconPlaceHolder,
			title: title,
			url: url,
		}

		if (prevBookmark?.url !== url) {
			bookmark.favicon = await fetchFavicon(url)
		}

		dispatch(editBookmark({ bookmark: bookmark, groupId: group?.id ?? "default" }))
		quitFrom()
	}
	const handleBookmarkSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault()
		setLoading(true)

		let bookmark: Bookmark = {
			id: nanoid(),
			favicon: iconPlaceHolder,
			title: title,
			url: url,
		}

		bookmark.favicon = await fetchFavicon(url)

		dispatch(addBookmark({ bookmark: bookmark, groupId: group?.id ?? "default" }))
		quitFrom()
	}
	const handleBookmarkDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault()
		dispatch(deleteBookmark({ bookmarkId: prevBookmark?.id ?? "", groupId: group?.id ?? "default" }))
		quitFrom()
	}

	const submit = (_: React.MouseEvent<HTMLButtonElement>) => {
		switch (mode) {
			case "addGroup":
				handleGroupSubmit(_)
				break
			case "editGroup":
				handleGroupEdit(_)
				break
			case "addBookmark":
				handleBookmarkSubmit(_)
				break
			case "editBookmark":
				handleBookmarkEdit(_)
				break
			default:
				break
		}
	}

	const remove = (_: React.MouseEvent<HTMLButtonElement>) => {
		switch (mode) {
			case "editBookmark":
				handleBookmarkDelete(_)
				break
			case "editGroup":
				handleGroupDelete(_)
				break
			default:
				break
		}
	}

	const quitFrom = () => {
		dispatch(resetFrom())
		setLoading(false)
	}

	const FromTitle = useCallback(() => {
		let formTitle = ""

		if (mode === "addBookmark") formTitle = "Add Bookmark"
		if (mode === "editBookmark") formTitle = "Edit Bookmark"
		if (mode === "addGroup") formTitle = "Add Group"
		if (mode === "editGroup") formTitle = "Edit Group"

		if (loading) formTitle = "Hold on a sec..."

		return <h1 className="text-2xl text-white font-bold mb-4">{formTitle}</h1>
	}, [mode, loading])

	return (
		<div
			className={`absolute flex-col bg-[#000000af] items-center justify-center w-[430px] h-[550px] z-20 ${
				visible ? "flex" : "hidden"
			}`}
		>
			<div className="flex flex-col w-3/4 bg-gradient-to-b from-zinc-700 to-zinc-800 p-5 rounded-lg">
				<FromTitle />
				{loading ? (
					<div className="flex flex-col items-center justify-center my-7">
						<div className="animate-spin rounded-full h-14 w-14 border-b-4 border-gray"></div>
					</div>
				) : (
					<form className="flex flex-col items-center justify-center">
						{(mode === "editGroup" || mode === "addGroup") && (
							<input
								value={groupTitle}
								className="w-full h-11 mb-4 bg-transparent transition-all duration-300 ease-in-out text-white
									border-[0.5px] border-[#757575] outline-none pl-2 
									hover:border-white
									focus:scale-[1.02] focus:border-white"
								type="text"
								placeholder={"Group Title"}
								onChange={handleGroupGroupNameChange}
							/>
						)}
						{(mode === "addBookmark" || mode === "editBookmark") && (
							<>
								<input
									value={title}
									className="w-full h-11 mb-4 bg-transparent transition-all duration-300 ease-in-out text-white
									border-[0.5px] border-[#757575] outline-none pl-2 
									hover:border-white
									focus:scale-[1.02] focus:border-white"
									type="text"
									placeholder={"Title"}
									onChange={handleTitleChange}
								/>
								<input
									value={url}
									className="w-full h-11  mb-4 bg-transparent transition-all duration-300 ease-in-out text-white
									border-[0.5px] border-[#757575] outline-none pl-2 
									hover:border-white
									focus:scale-[1.02] focus:border-white"
									type="url"
									placeholder="URL"
									onChange={handleUrlChange}
								/>
								<Select
									className="w-full mb-4"
									placeholder="Group"
									value={group?.id ? { value: group.id, label: group.title } : null}
									onChange={handleGroupChange}
									options={bookmarks.map((bookmarkGroup) => ({
										value: bookmarkGroup.id,
										label: bookmarkGroup.title,
									}))}
									theme={(theme: any) => ({
										...theme,
										colors: {
											...theme.colors,
											primary25: "#6b6b6b",
											primary: "#a5a5a5",
										},
									})}
									styles={{
										control: (provided: any) => ({
											...provided,
											backgroundColor: "#3f3f46",
											borderRadius: 0,
											borderWidth: 0,
										}),
										placeholder: (provided: any) => ({
											...provided,
											color: "#ffffff",
											borderColor: "#3f3f46",
										}),
										menu: (provided: any) => ({
											...provided,
											backgroundColor: "#3f3f46",
											color: "#ffffff",
										}),
										input: (provided: any) => ({
											...provided,
											borderColor: "#3f3f46",
											borderWidth: 0,
										}),
										singleValue: (provided: any) => ({
											...provided,
											color: "#ffffff",
											borderColor: "#3f3f46",
										}),
										valueContainer: (provided: any) => ({
											...provided,
											backgroundColor: "#3f3f46",
											color: "#ffffff",
											borderWidth: 0,
										}),
										container: (provided: any) => ({
											...provided,
											backgroundColor: "#3f3f46",
											color: "#ffffff",
											borderColor: "#3f3f46",
										}),
										indicatorsContainer: (provided: any) => ({
											...provided,
											backgroundColor: "#3f3f46",
											color: "#ffffff",
										}),
									}}
								/>
							</>
						)}
						<div className="flex justify-between w-full mt-2">
							{mode.includes("edit") && (
								<button
									className="ring-1 ring-[#fa3737] rounded-md px-2 py-1 text-[#fa3737] hover:bg-[#ee3333] hover:text-black transition-all duration-100 ease-in-out"
									type="submit"
									onClick={remove}
								>
									Delete
								</button>
							)}

							<div className="flex w-full items-center justify-end">
								<button
									className="ring-1 ring-[#a5a5a5] rounded-md px-4 py-1 text-[#a5a5a5] hover:bg-[#cecece] hover:text-black transition-all duration-100 ease-in-out mr-3"
									type="reset"
									onClick={quitFrom}
								>
									Cancel
								</button>
								<button
									className="ring-1 ring-white rounded-md px-4 py-1 text-white hover:bg-[#cecece] hover:text-black transition-all duration-100 ease-in-out"
									type="submit"
									onClick={submit}
								>
									{mode.includes("edit") ? "Save" : "Add"}
								</button>
							</div>
						</div>
					</form>
				)}
			</div>
		</div>
	)
}